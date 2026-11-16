import { Role } from '../users/role.enum';
import { ADMINS_ROOM, roomsForUser, unitRoom } from './realtime-rooms';

describe('roomsForUser', () => {
  it('puts admins in the admins room only', () => {
    expect(roomsForUser(Role.Admin, ['u1'])).toEqual([ADMINS_ROOM]);
  });

  it('puts a resident in one room per unit they belong to', () => {
    expect(roomsForUser(Role.Resident, ['u1', 'u2'])).toEqual([unitRoom('u1'), unitRoom('u2')]);
  });

  it('gives a resident with no units no rooms', () => {
    expect(roomsForUser(Role.Resident, [])).toEqual([]);
  });

  it('gives guards no rooms', () => {
    expect(roomsForUser(Role.Guard, ['u1'])).toEqual([]);
  });
});
