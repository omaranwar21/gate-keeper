import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { ADMINS_ROOM, roomsForUser, unitRoom } from './realtime-rooms';

export const ACCESS_LOG_CREATED = 'access-log:created';

// Read per request (not at import time) so FRONTEND_ORIGIN from .env is
// already loaded by ConfigModule. Unset = allow any origin (local dev).
function allowOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  const allowed = process.env.FRONTEND_ORIGIN?.split(',').map((o) => o.trim());
  callback(null, !allowed || !origin || allowed.includes(origin));
}

/** Pushes every new access-log entry to the admins and to the residents of
 * the scanned unit. Clients connect with `io(url, { auth: { token } })`
 * using the same JWT as the REST API; no token, a bad token, or an expired
 * one gets the socket disconnected. */
@WebSocketGateway({ cors: { origin: allowOrigin } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token: unknown = client.handshake.auth?.token;
    let payload: JwtPayload & { exp?: number };
    try {
      if (typeof token !== 'string') throw new Error('missing token');
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      client.disconnect(true);
      return;
    }

    const memberships = await this.prisma.unitResident.findMany({
      where: { userId: payload.sub },
      select: { unitId: true },
    });
    await client.join(
      roomsForUser(
        payload.role,
        memberships.map((m) => m.unitId),
      ),
    );

    // A socket outlives the HTTP request that authorised it, so cut it off
    // when the JWT expires; the client reconnects with a fresh token.
    if (payload.exp) {
      const timer = setTimeout(
        () => client.disconnect(true),
        payload.exp * 1000 - Date.now(),
      );
      client.once('disconnect', () => clearTimeout(timer));
    }
  }

  emitAccessLogCreated(log: { unitId: string | null }) {
    try {
      let target = this.server.to(ADMINS_ROOM);
      if (log.unitId) target = target.to(unitRoom(log.unitId));
      target.emit(ACCESS_LOG_CREATED, log);
    } catch (error) {
      // Live updates are best-effort: never fail a scan because of them.
      this.logger.warn(
        `Failed to emit ${ACCESS_LOG_CREATED}: ${String(error)}`,
      );
    }
  }
}
