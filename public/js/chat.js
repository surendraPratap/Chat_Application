const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = document.querySelector('#name');
const $messageFormButton = document.querySelector('#formSubmit')
const $SendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $location = document.querySelector('#locationId');
//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Query Option
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}




socket.on('locationMessage', (url) => {

    if (!url) {
        return 0;
    }
    const lochtml = Mustache.render(locationTemplate, {
        username: url.username,
        location: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')//{ message } shorthand
    });
    $messages.insertAdjacentHTML('beforeend', lochtml);
    autoscroll();
})

socket.on('roomData', ({ room, users }) => {

    const sideHtml = Mustache.render(sidebarTemplate, {
        room, users
    });
    document.querySelector('#sidebar').innerHTML = sideHtml;

})


socket.on('Welcome', (message) => {


    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')  // { message } shorthand
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();

})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // const message = document.querySelector('#name').value;
    const message = e.target.elements.name.value;

    $messageFormButton.setAttribute('disabled', 'disabled')

    socket.emit('message', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = "";
        $messageFormInput.focus();

        console.log('Message Delivered');
        if (error) {
            return console.log(error);
        }


    });
})
// socket.on

document.querySelector('#send-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation not supported by your browser');
    }
    $SendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('sendLocation', {
            "latitude": position.coords.latitude,
            "longitude": position.coords.longitude
        }, () => {
            $SendLocationButton.removeAttribute('disabled')
            console.log('Location Shared!')
        });
    })
})

socket.emit('join', { username, room }, (error) => {
    console.log(error);
    if (error) {
        alert(error);
        location.href = '/'
    }
})

// socket.on('countUpdated', (count) => {
//     console.log('The count is updated', count++)

// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('clicked')
//     socket.emit('increment')
// })