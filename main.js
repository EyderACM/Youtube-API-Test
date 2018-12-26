// Options

const CLIENT_ID = '422899188025-apeas8ni0e8ieaeb2qrd49unplh2epj8.apps.googleusercontent.com';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const buttonDiv = document.querySelector('.log-buttons');
const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const channelForm = document.getElementById('channel-form');
const channelInput = document.getElementById('channel-input');
const videoContainer = document.getElementById('video-container');

const defaultChannel = 'Redlettermedia'

//Form Submit and change channel
channelForm.addEventListener('submit', e => {
    e.preventDefault();

    const channel = channelInput.value;
    getChannel(channel);
})


// Load auth2 library 
function handleClientLoad() {
    gapi.load('client:auth2', initClient);

}

// Init API client library and set up sign in listeners
function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES    
    }).then(() => {
        //Listen for sign in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        // Handle initial sign in state
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    });
}

// Update UI sign in state changes
 function updateSigninStatus(isSignedIn) {
    content.classList.remove('hidden');
    buttonDiv.classList.remove('hidden');
    if(isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        content.style.display = 'block';
        videoContainer.style.display = 'block';
        getChannel(defaultChannel);
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        content.style.display = 'none';
        videoContainer.style.display = 'none';
    }
}

// Handle login
function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();
}

// Handle logout
function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut();
}

function showChannelData(data) {
    const channelData = document.getElementById('channel-data');
    channelData.innerHTML = data;
}

// Get Channel from API
function getChannel(channel) {
    gapi.client.youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        forUsername: channel
    })
    .then(response => {        
        const channel = response.result.items[0];

        const output = `
            <ul class="collection">
                <li class="collection__item">Title: ${channel.snippet.title}</li>
                <li class="collection__item">ID: ${channel.id}</li>
                <li class="collection__item">Subscribers: ${numberWithCommas(channel.statistics.subscriberCount)}</li>
                <li class="collection__item">Views: ${numberWithCommas(channel.statistics.viewCount)}</li>
                <li class="collection__item">Videos: ${numberWithCommas(channel.statistics.videoCount)}</li>
            </ul>
            <p>${channel.snippet.description}</p>
            <hr>
            <a class="button--grey" target="_blank" href="https://youtube.com/${channel.snippet.customUrl}">Visit Channel</a>
        `;
        showChannelData(output);

        const playlistId = channel.contentDetails.relatedPlaylists.uploads;
        requestVideoPlaylists(playlistId);
    })
    .catch(err => alert('No Channel By That Name'));
}


//Add commas to number
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function requestVideoPlaylists(playlistId) {
    const requestOptions = {
        playlistId: playlistId,
        part: 'snippet',
        maxResults: 10, 
    }

    const request = gapi.client.youtube.playlistItems.list(requestOptions);

    request.execute(response => {        
        const playListItems = response.items;
        if(playListItems) {            
            let output = `<h4 class="align-center">Latest Videos</h4><div class="videos">`;
            // Loop through videos and append output            
            playListItems.forEach(item => {
                const videoId = item.snippet.resourceId.videoId;
                output += `
                <div class="video">
                    <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; "picture-in-picture" allowfullscreen></iframe>
                </div>
                `;
            });
            // Output videos
            videoContainer.innerHTML += output;
            videoContainer.innerHTML += `</div>`;
        }else {
            videoContainer.innerHTML = "No Uploaded Videos";
        }
    });
}
