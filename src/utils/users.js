const users = [];

// addUser -> it's allowing us to track a new user
// removeUser -> will be remove user allowing us to stop tracking a user when the user leaves such as closing the chat room or tab.

// getUser -> it's allowing us to fetch and existing users data
// getUsersInRoom -> will be allowing us to get a complete list of all of the users in a specific room and also that's going to allow us to eventually render that users list to the sidebar.

const addUser = ({ id, username, room }) => {
  // Clean the data
  username = username.trim().toLowerCase(); // used trim for remove spaces before and after and toLowerCase used for make sure that those user names are not case sensitive.

  room = room.trim().toLowerCase();

  // Validate the data
  if (!username || !room) {
    return {
      error: 'Username and room are required!',
    };
  }

  // Check for existing user
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  // Validate username
  if (existingUser) {
    return {
      error: 'Username is in use!',
    };
  }

  // Store user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0]; // splice allows us to remove item's from an array by their index.
  }
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
  room = room.trim().toLowerCase();
  return users.filter((user) => user.room === room);
};

module.exports = { addUser, removeUser, getUser, getUsersInRoom };

/*
addUser({
    id: 21,
    username: 'Lakshman',
    room: 'New York'
});

addUser({
    id: 42,
    username: 'Mike',
    room: 'New York'
});

addUser({
    id: 25,
    username: 'Andrew',
    room: 'Center City'
});

const user = getUser(421);
console.log(user);

const userList = getUsersInRoom('fairmount');
console.log(userList);

 */
