/**
 * How often non-actors refresh PublicRoom via GET /game/rooms/current.
 * Actors update immediately from mutation responses.
 */
export const ROOM_POLL_MS = 750;
