// client side js
const socket = io();

// server (emit) -> client (receive) --acknowledgement --> server
// client (emit) -> server (receive) --acknowledgement --> client

// Elements
const $messageForm = document.querySelector('#message-form'); // used dollar sign just for convention
const $messageFormInput = document.querySelector('input');
const $messageFormButton = document.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector(
  '#location-message-template'
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
}); // This going to create an object with two properties (one would be room and other would be a question mark user name) and ignoreQueryPrefix: true for remove other symbol's like (question mark ?)

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild; // 'lastElementChild' that's going to grab the last element as a child which would be the new message since new messages are added to the bottom.

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom); // getting the margin value
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin; // take the margin value and added on to the height of the message for getting the total height.

  // Visible height
  const visibleHeight = $messages.offsetHeight; // for getting the entire message window size

  // Height of messages container
  const containerHeight = $messages.scrollHeight; // 'scrollHeight' gives us the total height that we are able to scroll through.

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight; // 'scrollTop' it gives us as a number the amount of distance we've scrolled from the top.

  // This conditional logic is going to run some code and that code will scroll to the bottom. The first thing going to take our container height so that the total container height not just visible. And then going to subtract the height of the last message (newMessageHeight). So that would be new message height. The reason for doing this is because we want to figure out if we were scrolled to the bottom but before this message (newMessageHeight) was added in. If we don't account for this we will never be scrolled to the bottom because we are running this code just after adding the new message and the user would never get a chance to scroll down. So in this case we are just taking the new message out of the mix. So we are seeing if that container height is less than or equal to and in this case it's going to be our scroll offset. So we want to make sure that we were indeed at the bottom before the last message was added. Then if we wear that's great we are going to auto scroll if not that's fine too. 🙂 We are not going to auto scroll.

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  console.log(message);

  // This is going to store the final html all will actually be rendering in the browser. Second argument is data for our template to render.
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });

  // This is gonna show the stored html to the browser
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', (message) => {
  console.log(message);

  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    mapUrl: message.url,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  //disable
  $messageFormButton.setAttribute('disabled', 'disabled');

  const message = event.target.elements.message.value;

  socket.emit('sendMessage', message, (error) => {
    // enable
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log('Message delivered!');
  });
});

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.');
  }

  // disable
  $sendLocationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    // console.log(position);

    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute('disabled');
        console.log('Location shared!');
      }
    );
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
