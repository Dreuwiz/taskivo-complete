// Maps email → { password, userId }
// userId must match an id in INIT_USERS
export const CREDENTIALS = {
  "alice@taskivo.com":  { password:"alice123",  userId:1 },//user
  "ben@taskivo.com":    { password:"ben123",    userId:2 },//user
  "carla@taskivo.com":  { password:"carla123",  userId:3 },//user
  "mia@taskivo.com":    { password:"mia123",    userId:4 },//user
  "dan@taskivo.com":    { password:"dan123",    userId:5 },//team leader
  "eva@taskivo.com":    { password:"eva123",    userId:6 },//team leader
  "frank@taskivo.com":  { password:"frank123",  userId:7 },//manager
  "grace@taskivo.com":  { password:"grace123",  userId:8 },//admin
};
