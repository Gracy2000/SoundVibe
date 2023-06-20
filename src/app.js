import http from "./libs/slhttp.js"

/*******************************AUTHORIZATION******************************************* */

var client_id = "acf8f812cd514126992e9849295ec6f4";
var client_secret = "a1d760f34b30455abc1e86c025107f8d";
var redirect_uri = "http://localhost:9000/";
const loginbtn = document.getElementById('login-btn');
const loginpage = document.getElementById('login-page');
const mainpage = document.getElementById('main-page');
const footer = document.getElementById('footer');
const AUTHORIZE = "https://accounts.spotify.com/authorize";


window.onload = onPageLoad();

function onPageLoad(){
    
        if ( window.location.search.length > 0 ){
            
            handleRedirect();
        }
        else {
            let access_token = localStorage.getItem("access_token");
            if ( access_token == null ){
                loginpage.style.display = 'block';
                mainpage.style.display = 'none';
                footer.style.display = 'none';   
            }
            else {
                loginpage.style.display = 'none';
                mainpage.style.display = 'block';
                footer.style.display = 'block';
                fetchCategories();
                fetchAlbums();
                fetchTracks();
                getUserDetails();
            }
        } 
}

loginbtn.addEventListener('click' , loginFunc);
function loginFunc() {
    authorize();
}

function authorize() {
    let url = AUTHORIZE;
    url += '?client_id=' + client_id;
    url += '&response_type=code';
    url += '&redirect_uri=' + redirect_uri;
    url += '&show_dialog=false';
    url += '&scope=user-read-private user-read-email ugc-image-upload user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-modify user-follow-read user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read';
    window.location.href = url;
}

function handleRedirect(){
    let code = getCode();
    requestAccessToken(code);
    
}

function getCode() {
    let URL = window.location.search;
    let code;
    if ( URL.length > 0 ){
        const urlParams = new URLSearchParams(URL);
        code = urlParams.get('code')
    }
    return code;
}

function requestAccessToken(code) {
    let data = "grant_type=authorization_code"
    data += "&code=" + code;
    data += "&redirect_uri="+ redirect_uri;
    data += '&client_id=' + client_id;
    data += '&client_secret=' + client_secret;
    const url = 'https://accounts.spotify.com/api/token';
    const requestHeader = {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Authorization' : 'Basic ' + btoa(client_id + ':' + client_secret),
    };

    let xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ':' + client_secret));
    xhr.send(data);
    xhr.onload = function() {
        if(this.status == 200)
        {
            const res = JSON.parse(xhr.responseText);
            if(res.access_token != null)
            {
                localStorage.setItem("access_token" , res.access_token)
            }
            if(res.refresh_token != null)
            {
                localStorage.setItem("refresh_token" , res.refresh_token)
            }
            window.location.href = redirect_uri;
        }
        else 
        {
            console.log(this.responseText);
            alert(this.responseText);
        }
    }
}

function refreshAccessToken(){
    let refresh_token = localStorage.getItem("refresh_token");
    let data = "grant_type=refresh_token";
    data += "&refresh_token=" + refresh_token;
    data += "&client_id=" + client_id;

    const url = 'https://accounts.spotify.com/api/token';

    let xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ':' + client_secret));
    xhr.send(data);
    xhr.onload = function() {
        if(this.status == 200)
        {
            const res = JSON.parse(xhr.responseText);
            if(res.access_token != null)
            {
                localStorage.setItem("access_token" , res.access_token)
            }
            if(res.refresh_token != null)
            {
                localStorage.setItem("refresh_token" , res.refresh_token)
            }
        }
        else 
        {
            console.log(this.responseText);
            alert(this.responseText);
        }

    }
}

/*******************************AUTHORIZATION******************************************* */


/*******************************MAIN FUNCTIONS******************************************* */

const contentSection = document.getElementById('content-section');
const userDetails = document.getElementById('user-details');
const homeBtn = document.getElementById('home-btn');
const newReleaseBtn = document.getElementById('new-release-btn');
const userPlaylistsBtn = document.getElementById('user-playlists-btn');
const likeSectionBtn = document.getElementById('like-section-btn');
const searchBar = document.getElementById('search-bar');
const songDetails = document.getElementById('song-details');
const playPauseBtn = document.getElementById('play-pause-btn');
const likeBtn = document.getElementById('like-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const progressBar = document.getElementById('progress-bar')
const progressPoint = document.getElementById('progress-point')
const logoutBtn = document.getElementById('log-out');


var playing = false;
var song;
var songID;
var songName;
var songImgUri;
var likeStatus;
var currentUserID;
var isPlaylistFollowed;
var prevId;
var nextId;
var currentDuration = 0;
var previewDuration = 30;
var songList = new Array();
var pauseAfterCompletion;
var playNextSong;
var timePLayed;


var audio = document.createElement("AUDIO")
footer.appendChild(audio);


/*******************************USER DETAILS FUNCTIONS************************************************** */
function getUserDetails() {
    let url = "https://api.spotify.com/v1/me"; 
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            currentUserID = res.id;
            userDetails.innerHTML = `
            <span class="p-r-40">Signed in as:</span> <img src="${res.images[0].url}" width="40px" height="40px" alt=""><span>${res.display_name}</span>
            `;
        })
        .catch(function(err){
            refreshAccessToken();
        });
}

/*******************************HOME PAGE FUNCTIONS************************************************** */
function fetchCategories() {
    let body = '';
    body += `<!-- This is CATEGORIES SECTION -->
            <div id="categories-section" class="categories m-20">
                <h3 class="m-10 p-20">Categories</h3>
                <div id="categories" class="row">
    `;

    let url = "https://api.spotify.com/v1/browse/categories"; 
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            res.categories.items.forEach(item => {
                body += `
                        <div class="card m-20">
                            <img data-name = "${item.name}" data-id = "${item.id}" data-type = "categories" src="${item.icons[0].url}" class="img-responsive bg-light" alt="...">
                            <div class="p-15 ">
                                <h6 data-name = "${item.name}" data-id = "${item.id}" data-type = "categories" class="text-color-light p-b-10">${item.name}</h6>
                            </div>
                        </div>
                `;
                })
                body += `</div>
                                </div>`;
                contentSection.innerHTML = body;
            })
            .catch(function(err){
                if(err.status == 401)
                    refreshAccessToken();
                else
                    console.warn(err);  
            });
}
function fetchAlbums() {
    let body = '';
    body += `<!-- This is ALBUMS SECTION -->
            <div id="albums-section" class="albums m-20">
                <h3 class="m-10 p-20">Popular Albums</h3>
                <div id="albums" class="row">
    `;
    let url = "https://api.spotify.com/v1/search?q=OK_jaanu&type=album&include_external=audio"; 
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            res.albums.items.forEach(item => {
                body += `
                        <div class="card m-20">
                            <img data-id = "${item.id}" data-type = "${item.type}" src="${item.images[1].url}" class="img-responsive bg-light" alt="...">
                            <div class="p-15 ">
                                <h6 data-id = "${item.id}" data-type = "${item.type}" class="text-color-light p-b-10">${item.name}</h6>
                                <p data-id = "${item.id}" data-type = "${item.type}"class="text-color-light p-b-10">Artist :- ${item.artists[0].name}</p>
                            </div>
                        </div>
                `;
                })
                body += `</div>
                                </div>`;
                contentSection.innerHTML += body;
            })
            .catch(function(err){
                if(err.status == 401)
                    refreshAccessToken();
                else
                    console.warn(err);  
            });
}
function fetchTracks() {
    let body = '';
    body += `<!-- This is TRACKS SECTION -->
        <div id="songs-section" class="songs m-20">
            <h3 class="m-10 p-20">Songs</h3>
            <table>
                <tr id="headings">
                    <th class="nos">No.</th>
                    <th class="titles">Title</th>
                    <th class="albums">Album</th>
                    <th class="artists">Artist</th>
                    <th class="duration">Duration</th>
                </tr>
    ` ;
    let count = 1;
    let url = "https://api.spotify.com/v1/me/tracks/"; 
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            res.items.forEach(item => {
                songList.push(item.track.id);
                let duration = item.track.duration_ms;
                let min = Math.floor((duration/1000/60) << 0)
                let sec = Math.floor((duration/1000) % 60);
                body += `
                    <tr class="songs">
                        <td class="nos"><span>${count}</span></td>
                        <td class="titles"><img data-id = "${item.track.id}" data-uri = "${item.track.preview_url}" data-type = "${item.track.type}" src="${item.track.album.images[2].url}" alt=""><span data-id = "${item.track.id}" data-uri = "${item.track.preview_url}" data-type = "${item.track.type}">${item.track.name} </span></td>
                        <td class="albums"><span data-id="${item.track.album.id}" data-type="${item.track.album.type}">${item.track.album.name}</span></td>
                        <td class="artists"><span>${item.track.artists[0].name}</span></td>
                        <td class="duration"><span>${min} : ${sec}</span></td>
                    </tr>
                `;
                count++;
                });

            body += `
                </table>
            </div>
            `
            contentSection.innerHTML += body;
        })
        .catch(function(err){
            if(err.status == 401)
                refreshAccessToken();
            else
                console.warn(err);  
        });
}


/*******************************PLAYLISTS PAGE FUNCTIONS******************************************* */
contentSection.addEventListener('click' , fetchMultiplePlaylists)
function fetchMultiplePlaylists(evt) {
    let body = '';
    body += `<div id="playlists-section" class="playlists m-20">
                                            <h3 class="m-10 p-20">${evt.target.dataset.name}</h3>
                                            <div id="playlists" class="row">
                                        `;
    let type = evt.target.dataset.type
    if(type == "categories")
    {
        let query = evt.target.dataset.id
        let url = `https://api.spotify.com/v1/browse/categories/${query}/playlists`; 

        const requestHeader = {
            'Content-Type' : 'application/json',
            'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
        };
        http.get(url , requestHeader)
            .then(function(res){
                res.playlists.items.forEach(item => {
                    body += `
                            <div class="card m-20">
                                <img data-id = "${item.id}" data-type = "${item.type}"src="${item.images[0].url}" class="img-responsive bg-light" alt="...">
                                <div class="p-15 ">
                                    <h6 data-id = "${item.id}" data-type = "${item.type}" class="text-color-light p-b-10">${item.name}</h6>
                                    <!--<p class="text-color-light p-b-10">Artist :- ${item.description}</p>-->
                                </div>
                            </div>
                    `;
                    });
                    body += `</div>
                                    </div>`;
                    contentSection.innerHTML = body;
            })
            .catch(function(err){
                if(err.status == 401)
                    refreshAccessToken();
                else
                    console.warn(err);  
            });
    }
}


/*******************************SINGLE PLAYLIST PAGE FUNCTIONS************************************* */
contentSection.addEventListener('click' , fetchSinglePlaylist);
function fetchSinglePlaylist(evt) {
    let body = '';
    let count = 1;
    let type = evt.target.dataset.type
    if(type == "playlist")
    {
        let id = evt.target.dataset.id
        isPlaylistSaved(id);
        let url = `https://api.spotify.com/v1/playlists/${id}`; 
        const requestHeader = {
            'Content-Type' : 'application/json',
            'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
        };
        http.get(url , requestHeader)
            .then(function(res){
                contentSection.innerHTML = '';
                if(!isPlaylistFollowed)
                {
                    body += `
                            <div id="playlist-section" class="playlist m-20">
                                <div class="playlist-content">

                                    <div class="playlist-container">
                                        <img src="${res.images[0].url}" id="playlist-img" width="320px" height="320px" alt="Snow" >
                                        
                                    </div>
                                    
                                    <div class="playlist-text">
                                        <h6>Playlist</h6>
                                        <h1>${res.name}</h1>
                                        <p>${res.description}</p>
                                    </div>

                                </div>
                                <div class="playlist-content">
                                    <button data-type="play" class="play-button"><i data-type="play" class="fa fa-play" aria-hidden="true"></i></button>
                                    <div data-id="${id}" data-type="follow" class="follow-button"><i class="fa fa-heart-o" aria-hidden="true"></i></div>
                                </div>
                            </div>
                            `;
                }
                else{
                    body += `
                            <div id="playlist-section" class="playlist m-20">
                                <div class="playlist-content">

                                    <div class="playlist-container">
                                        <img src="${res.images[0].url}" id="playlist-img" width="320px" height="320px" alt="Snow" >
                                    </div>
                                    
                                    <div class="playlist-text">
                                        <h6>Playlist</h6>
                                        <h1>${res.name}</h1>
                                        <p>${res.description}</p>
                                    </div>
                                </div>
                                <div class="playlist-content">
                                    <button data-type="play" class="play-button"><i class="fa fa-play" aria-hidden="true"></i></button>
                                    <div data-id="${id}" data-type="unfollow" class="unfollow-button"><i class="fa fa-heart" aria-hidden="true"></i></div>
                                </div>
                            </div>
                            `;
                }
                body += `
                    
                        <h3 class="m-10 p-20">Songs</h3>
                        <table>
                            <tr id="headings">
                                <th class="nos">No.</th>
                                <th class="titles">Title</th>
                                <th class="albums">Album</th>
                                <th class="artists">Artist</th>
                                <th class="duration">Duration</th>
                            </tr>
                ` ;
                songList = [];
                res.tracks.items.forEach(item => {
                        songList.push(item.track.id);
                        let duration = item.track.duration_ms;
                        let min = Math.floor((duration/1000/60) << 0)
                        let sec = Math.floor((duration/1000) % 60);
                        body += `
                            <tr class="songs">
                                <td class="nos"><span>${count}</span></td>
                                <td class="titles"><img data-id = "${item.track.id}" data-uri = "${item.track.preview_url}" data-type = "${item.track.type}" src="${item.track.album.images[2].url}" alt=""><span data-id = "${item.track.id}" data-uri = "${item.track.preview_url}" data-type = "${item.track.type}">${item.track.name} </span></td>
                                <td class="albums"><span data-id="${item.track.album.id}" data-type="${item.track.album.type}">${item.track.album.name}</span></td>
                                <td class="artists"><span>${item.track.artists[0].name}</span></td>
                                <td class="duration"><span>${min} : ${sec}</span></td>
                            </tr>
                        `;
                        count++;
                    });
    
                body += `
                    </table>
                
                
                `
                contentSection.innerHTML = body;
            })
            .catch(function(err){
                if(err.status == 401)
                    refreshAccessToken();
                else
                    console.warn(err);  
            });
    }
}
function isPlaylistSaved(id) {

    let url = `https://api.spotify.com/v1/playlists/${id}/followers/contains/?ids=${currentUserID}`;
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            isPlaylistFollowed = res[0];
            console.log(isPlaylistFollowed)
        })
        .catch(function(err){
            if(err.status == 401)
                refreshAccessToken();
            else
                console.warn(err);  
        });
}
contentSection.addEventListener('click' , followUnfollowPlaylist);
function followUnfollowPlaylist(e){
    
    if(e.target.dataset.type == "unfollow" || e.target.parentElement.dataset.type == "unfollow")
    {
        let id
        if(e.target.dataset.type == "unfollow")
            id = e.target.dataset.id
        else if(e.target.parentElement.dataset.type == "unfollow")
            id = e.target.parentElement.dataset.id
        let body;
        let url = `https://api.spotify.com/v1/playlists/${id}/followers/`;
            const requestHeader = {
                'Content-Type' : 'application/json',
                'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
            };
            http.delete(url , requestHeader)
                .then(function(res){
                    console.log("hii");
                    if(e.target.dataset.type == "unfollow")
                    {
                        e.target.dataset.type = "follow";
                        e.target.classList.remove('unfollow-button');
                        e.target.classList.add('follow-button');
                        e.target.innerHTML = `<i class="fa fa-heart-o" aria-hidden="true"></i>`
                    } 
                    else if(e.target.parentElement.dataset.type == "unfollow")
                    {
                        e.target.parentElement.dataset.type = "follow";
                        e.target.parentElement.classList.remove('unfollow-button');
                        e.target.parentElement.classList.add('follow-button');
                        e.target.classList.remove('fa-heart');
                        e.target.classList.add('fa-heart-o');
                    }
                })
                .catch(function(err){
                    if(err.status == 401)
                        refreshAccessToken();
                    else
                        console.warn(err);   
                });   
    }
    else if(e.target.dataset.type == "follow" || e.target.parentElement.dataset.type == "follow")
    {
        let id
        if(e.target.dataset.type == "follow")
            id = e.target.dataset.id
        else if(e.target.parentElement.dataset.type == "follow")
            id = e.target.parentElement.dataset.id

        let body;
        let url = `https://api.spotify.com/v1/playlists/${id}/followers/`;
            const requestHeader = {
                'Content-Type' : 'application/json',
                'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
            };
            http.put(url , body , requestHeader)
            .then(function(res){
                if(e.target.dataset.type == "follow")
                {
                    e.target.dataset.type = "unfollow";
                    e.target.classList.remove('follow-button');
                    e.target.classList.add('unfollow-button');
                    e.target.innerHTML = `<i class="fa fa-heart" aria-hidden="true"></i>`
                } 
                else if(e.target.parentElement.dataset.type == "follow")
                {
                    e.target.parentElement.dataset.type = "unfollow";
                    e.target.parentElement.classList.remove('follow-button');
                    e.target.parentElement.classList.add('unfollow-button');
                    e.target.classList.remove('fa-heart-o');
                    e.target.classList.add('fa-heart');
                }    
            })
            .catch(function(err){
                if(err.status == 401)
                    refreshAccessToken();
                else
                    console.warn(err);   
            });
    }
}

/*******************************SINGLE ALBUM PAGE FUNCTIONS************************************* */
contentSection.addEventListener('click' , fetchSingleAlbums);
function fetchSingleAlbums(evt) {
    let body = '';
    let count = 1;
    let type = evt.target.dataset.type
    if(type == "album")
    {
        let id = evt.target.dataset.id
        let url = `https://api.spotify.com/v1/albums/${id}`; 
        const requestHeader = {
            'Content-Type' : 'application/json',
            'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
        };
        http.get(url , requestHeader)
            .then(function(res){
                body += `
                <div id="album-section" class="album m-20">
                    <div class="album-content">
                        <img src="${res.images[0].url}" width="320px" height="320px" alt="Snow" >
                        <div class="album-text">
                            <h6>Album</h6>
                            <h2>${res.name}</h2>
                            <p>${res.artists[0].name}</p>
                        </div>
                    </div>
                </div>
                `;
                body += `
                    <h3 class="m-10 p-20">Songs</h3>
                    <table>
                        <tr id="headings">
                            <th class="nos">No.</th>
                            <th class="titles">Title</th>
                            <th class="albums">Album</th>
                            <th class="artists">Artist</th>
                            <th class="duration">Duration</th>
                        </tr>
                    ` ;
                let albumName = res.name;
                songList = [];
                res.tracks.items.forEach(item => {
                        songList.push(item.id);
                        let duration = item.duration_ms;
                        let min = Math.floor((duration/1000/60) << 0)
                        let sec = Math.floor((duration/1000) % 60);
                        body += `
                            <tr class="songs">
                                <td class="nos"><span>${count}</span></td>
                                <td class="titles"><span data-id = "${item.id}" data-uri = "${item.preview_url}" data-type = "${item.type}">${item.name} </span></td>
                                <td class="albums"><span>${albumName}</span></td>
                                <td class="artists"><span>${item.artists[0].name}</span></td>
                                <td class="duration"><span>${min} : ${sec}</span></td>
                            </tr>
                        `;
                        count++;
                    });
    
                body += `
                    </table>
                `
                contentSection.innerHTML = body;
            })
            .catch(function(err){
                if(err.status == 401)
                    refreshAccessToken();
                else
                    console.warn(err);  
            });
    }
}


/*******************************MENU BUTTON FUNCTIONS************************************* */
homeBtn.addEventListener('click' , fetchHomeContent)
function fetchHomeContent(evt) {
    evt.preventDefault();
    fetchCategories();
    fetchAlbums();
    fetchTracks();
}
newReleaseBtn.addEventListener('click' , fetchNewReleases)
function fetchNewReleases(e) {
    e.preventDefault();
    let body = '';
    let url = "https://api.spotify.com/v1/browse/new-releases"; 
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    body += `<div id="new-release-section" class="new-release m-20">
                                            <h3 class="m-10 p-20">New Releases</h3>
                                            <div id="new-release" class="row">
                                        `;
    http.get(url , requestHeader)
        .then(function(res){  
            res.albums.items.forEach(item => {
                body += `
                    
                        
                            <div class="card m-20">
                                <img data-id = "${item.id}" data-type = "${item.type}" src="${item.images[1].url}" class="img-responsive bg-light" alt="...">
                                <div class="p-15 ">
                                    <h6 data-id = "${item.id}" data-type = "${item.type} class="text-color-light p-b-10">${item.name}</h6>
                                    <p data-id = "${item.id}" data-type = "${item.type} class="text-color-light p-b-10">Artist :- ${item.artists[0].name}</p>
                                </div>
                            </div>
                        
                   
                `;
                });
                body += `</div>
                        </div>`;
                contentSection.innerHTML = body;
            
            })
        .catch(function(err){
            if(err == 401)
                refreshAccessToken();
            else
                console.error(err);
                
        });
}
userPlaylistsBtn.addEventListener('click' , userPlaylists)
function userPlaylists(e) {
    e.preventDefault();
    let body = '';
    let url = "https://api.spotify.com/v1/me/playlists"; 
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    body += `<div id="user-playlists-section" class="user-playlists m-20">
                                            <h3 class="m-10 p-20">Your Playlists</h3>
                                            <div id="user-playlists" class="row">
                                        `;
    http.get(url , requestHeader)
        .then(function(res){
            res.items.forEach(item => {
                body += `
                    
                        
                            <div class="card m-20">
                                <img data-id = "${item.id}" data-type = "${item.type}" src="${item.images[0].url}" class="img-responsive bg-light" alt="...">
                                <div class="p-15 ">
                                    <h6 data-id = "${item.id}" data-type = "${item.type}" class="text-color-light p-b-10">${item.name}</h6>
                                    <!--<p class="text-color-light p-b-10">Artist :- ${item.description}</p>-->
                                </div>
                            </div>
                        
                
                `;
                });
            body += `</div>
                        </div>`;
            contentSection.innerHTML = body;
            
            })
        .catch(function(err){
            if(err == 401)
                refreshAccessToken();
            else
                console.error(err);
                
        });
}
likeSectionBtn.addEventListener('click' , likedSongs)
function likedSongs(e) {
    e.preventDefault();
    let body = '';
    body += `
        <div id="songs-section" class="songs m-20">
        <h3 class="m-10 p-20">Songs</h3>
        <table>
            <tr id="headings">
                <th class="nos">No.</th>
                <th class="titles">Title</th>
                <th class="albums">Album</th>
                <th class="artists">Artist</th>
                <th class="duration">Duration</th>
            </tr>
    ` ;
    let count = 1;
    let url = "https://api.spotify.com/v1/me/tracks/"; 
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            songList = [];
            res.items.forEach(item => {
                songList.push(item.track.id);
                let duration = item.track.duration_ms;
                let min = Math.floor((duration/1000/60) << 0)
                let sec = Math.floor((duration/1000) % 60);
                body += `
                    <tr class="songs">
                        <td class="nos"><span>${count}</span></td>
                        <td class="titles"><img data-id = "${item.track.id}" data-uri = "${item.track.preview_url}" data-type = "${item.track.type}" src="${item.track.album.images[2].url}" alt=""><span data-id = "${item.track.id}" data-uri = "${item.track.preview_url}" data-type = "${item.track.type}">${item.track.name} </span></td>
                        <td class="albums"><span>${item.track.album.name}</span></td>
                        <td class="artists"><span>${item.track.artists[0].name}</span></td>
                        <td class="duration"><span>${min} : ${sec}</span></td>
                    </tr>
                `;
                count++;
                });

            body += `
                </table>
            </div>
            `

            contentSection.innerHTML = body;
        })
        .catch(function(err){
            if(err == 401)
                refreshAccessToken();
            else
                console.warn(err);
                
        });
}


/*******************************SEARCH BAR FUNCTIONS************************************* */
searchBar.addEventListener('keyup' , searchTrackFunc)
function searchTrackFunc() {
    let query = searchBar.value;
    let body = '';

    body += `
        <div id="songs-section" class="songs m-20">
        <h3 class="m-10 p-20">Songs</h3>
        <table>
            <tr id="headings">
                <th class="nos">No.</th>
                <th class="titles">Title</th>
                <th class="albums">Album</th>
                <th class="artists">Artist</th>
                <th class="like">Like</th>
                <th class="duration">Duration</th>
            </tr>
    ` ;
    let count = 1;
    let url = `https://api.spotify.com/v1/search?q=${query}&type=track&include_external=audio`
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            songList = [];
            res.tracks.items.forEach(item => {
                songList.push(item.id)
                let duration = item.duration_ms;
                let min = Math.floor((duration/1000/60) << 0)
                let sec = Math.floor((duration/1000) % 60);
                body += `
                    <tr class="songs">
                        <td class="nos"><span>${count}</span></td>
                        <td class="titles"><img data-id = "${item.id}" data-uri = "${item.preview_url}" data-type = "${item.type}" src="${item.album.images[2].url}" alt=""><span data-id = "${item.id}" data-uri = "${item.preview_url}" data-type = "${item.type}">${item.name} </span></td>
                        <td class="albums"><span data-id="${item.album.id}" data-type="${item.album.type}">${item.album.name}</span></td>
                        <td class="artists"><span>${item.artists[0].name}</span></td>
                        <td class="like"><span id="like-dislike"><i class="fa fa-heart-o fa-2x p-5" data-id = "${item.id}" data-type = "like" data-like = "false" aria-hidden="true"></i></span></td>
                        <td class="duration"><span>${min} : ${sec}</span></td>
                    </tr>
                `;
                count++;
                });

            body += `
                </table>
            </div>
            `

            contentSection.innerHTML = body;
            searchAlbumFunc();
        })
        .catch(function(err){
            if(err == 401)
                refreshAccessToken();
            else
                console.warn(err);
                
        });

}
function searchAlbumFunc() {
    let query = searchBar.value;
    let body = '';
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    let url = `https://api.spotify.com/v1/search?q=${query}&type=album&include_external=audio`
    body = '';
    body += `<div id="albums-section" class="albums m-20">
                <h3 class="m-10 p-20">Albums</h3>
                <div id="albums" class="row">
    ` 
    http.get(url , requestHeader)
        .then(function(res){
            res.albums.items.forEach(item => {
                body += `
                            <div class="card m-20">
                                <img data-id = "${item.id}" data-type = "${item.type}" src="${item.images[1].url}" class="img-responsive bg-light" alt="...">
                                <div class="p-15 ">
                                    <h6 data-id = "${item.id}" data-type = "${item.type}" class="text-color-light p-b-10">${item.name}</h6>
                                    <p data-id = "${item.id}" data-type = "${item.type}"class="text-color-light p-b-10">Artist :- ${item.artists[0].name}</p>
                                </div>
                            </div>  
                `;
                })
                body += `</div>
                        </div>`;
                contentSection.innerHTML += body;
                searchPlaylistFunc();
            })
            .catch(function(err){
                if(err == 401)
                    refreshAccessToken();
                else
                    console.warn(err);
                    
            });
}
function searchPlaylistFunc() {
    let query = searchBar.value;
    let body = '';
    body += `<div id="playlists-section" class="playlists m-20">
                <h3 class="m-10 p-20">Playlists</h3>
                <div id="playlists" class="row">
                                        `;
    let url = `https://api.spotify.com/v1/search?q=${query}&type=playlist&include_external=audio`
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            res.playlists.items.forEach(item => {
                body += `
                        
                            
                            <div class="card m-20">
                                <img data-id = "${item.id}" data-type = "${item.type}"src="${item.images[0].url}" class="img-responsive bg-light" alt="...">
                                <div class="p-15 ">
                                    <h6 data-id = "${item.id}" data-type = "${item.type}" class="text-color-light p-b-10">${item.name}</h6>
                                    <!--<p class="text-color-light p-b-10">Artist :- ${item.description}</p>-->
                                </div>
                            </div>
                            
                    
                `;
                });
                body += `</div>
                        </div>`;
                contentSection.innerHTML += body;
        })
        .catch(function(err){
            if(err == 401)
                refreshAccessToken();
            else
                console.warn(err);
                
        });
    
}


/*******************************TRACK FUNCTIONS************************************* */
contentSection.addEventListener('click' , (e) => {
    if(e.target.dataset.type == "track")
        playPauseFunc(e.target.dataset.id);
})
function playPauseFunc(id) {
    currentDuration = 0;
    progressBar.style.width = 0 + "%";
    progressPoint.style.display = 'block';
    clearInterval(playNextSong);
    clearInterval(timePLayed);
    songID = id
    let url = `https://api.spotify.com/v1/tracks/${songID}`; 
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            isLiked();
            assignNextPrevId();
            songImgUri = res.album.images[1].url;
            songName = res.name;
            song = res.preview_url;
            if(song == null)
            {
                alert(songName + " cannot be played!!! Since url not found!!!")
                setTimeout(() => {
                    playPauseFunc(nextId)
                }, 500);
                
            }
            else
            {
                songDetails.innerHTML = `
                    <h6>Current Playing</h6>
                    <img src="${res.album.images[1].url}" width="225px" height="225px" alt=""> 
                    <h6>Song Name : ${res.name}</h6>
                `
                playPauseBtn.innerHTML = `<i class="fa fa-pause fa-2x p-5" aria-hidden="true"></i>`;
                playing = true;
                audio.src = song;
                audio.play()
                
                timePLayed = setInterval(() => {
                    currentDuration++;
                    console.log(currentDuration);
                    progressBar.style.width = (currentDuration / previewDuration) * 100 + "%";
                }, 1000);
                pauseAfterCompletion = setTimeout(() => {
                    playPauseBtn.innerHTML = `<i class="fa fa-play-circle fa-2x p-5" aria-hidden="true"></i>`;
                    playing = false;
                    audio.pause();
                }, 30100);
                playNextSong = setInterval(() => {
                    playPauseFunc(nextId);
                }, 30200);
            }
        })
        .catch(function(err){
            if(err.status == 401)
                refreshAccessToken();
            else
                console.warn(err);  
        });
}
function isLiked(e) {

    let url = `https://api.spotify.com/v1/me/tracks/contains?ids=${songID}`; 
    const requestHeader = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
    };
    http.get(url , requestHeader)
        .then(function(res){
            likeStatus = res[0];
            // console.log(likeStatus)
            if(likeStatus)
            {
                likeBtn.innerHTML = `<i class="fa fa-heart fa-2x p-5" aria-hidden="true"></i>`;
                likeBtn.style.color = "red"
            }else {
                likeBtn.innerHTML = `<i class="fa fa-heart-o fa-2x p-5" aria-hidden="true"></i>`;
                likeBtn.style.color = "white"
            }
        })
        .catch(function(err){
            if(err.status == 401)
                refreshAccessToken();
            else
                console.warn(err);   
        });
}
playPauseBtn.addEventListener('click' , function(){
    
    if(audio.src != '')
    {
        if(playing === true)
        {
            playPauseBtn.innerHTML = `<i class="fa fa-play-circle fa-2x p-5" aria-hidden="true"></i>`;
            playing = false;
            audio.pause();
            clearTimeout(pauseAfterCompletion);
            clearInterval(playNextSong);
            clearInterval(timePLayed);
        }
        else if(playing === false)
        {
            playPauseBtn.innerHTML = `<i class="fa fa-pause fa-2x p-5" aria-hidden="true"></i>`;
            playing = true;
            audio.play()
            songDetails.innerHTML = `
                        <h6>Current Playing</h6>
                        <img src="${songImgUri}" width="225px" height="225px" alt=""> 
                        <h6>Song Name : ${songName}</h6>
                    `;
            pauseAfterCompletion = setTimeout(() => {
                playPauseBtn.innerHTML = `<i class="fa fa-play-circle fa-2x p-5" aria-hidden="true"></i>`;
                playing = false;
                audio.pause();
            }, 30100 - currentDuration*1000);
            playNextSong = setInterval(() => {
                playPauseFunc(nextId);
            }, 30200 - currentDuration*1000);
            timePLayed = setInterval(() => {
                currentDuration++;
                console.log(currentDuration);
                progressBar.style.width = (currentDuration / previewDuration) * 100 + "%";
            }, 1000);
            
        }
        if(likeStatus === true)
        {
            likeBtn.innerHTML = `<i class="fa fa-heart fa-2x p-5" aria-hidden="true"></i>`;
            likeBtn.style.color = "red";
        }else {
            likeBtn.innerHTML = `<i class="fa fa-heart-o fa-2x p-5" aria-hidden="true"></i>`;
            likeBtn.style.color = "white";
        }
    }
})
likeBtn.addEventListener('click' , function(){
    
    if(likeStatus === true)
    {
        likeBtn.innerHTML = `<i class="fa fa-heart-o fa-2x p-5" aria-hidden="true"></i>`;
        likeBtn.style.color = "white"
        likeStatus = false;
        let url = "https://api.spotify.com/v1/me/tracks?ids="+songID;
        let body = songID;
        const requestHeader = {
            'Content-Type' : 'application/json',
            'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
        };
        http.delete(url  , requestHeader)
        .then(function(res){
            
        })
        .catch(function(err){
            if(err.status == 401)
                refreshAccessToken();
            else
                console.warn(err);   
        });    
    }
    else if(likeStatus === false)
    {
        likeBtn.innerHTML = `<i class="fa fa-heart fa-2x p-5" aria-hidden="true"></i>`;
        likeStatus = true;
        likeBtn.style.color = "red"
        let url = "https://api.spotify.com/v1/me/tracks?ids="+songID;
            let body = songID;
            const requestHeader = {
                'Content-Type' : 'application/json',
                'Authorization' : 'Bearer ' + localStorage.getItem("access_token"),
            };
            http.put(url , body , requestHeader)
            .then(function(res){
                
            })
            .catch(function(err){
                if(err.status == 401)
                    refreshAccessToken();
                else
                    console.warn(err);   
            });
    }
})
function assignNextPrevId() {
    let currentIndex = songList.indexOf(songID);
    nextId = songList[currentIndex + 1];
    prevId = songList[currentIndex - 1];
    nextBtn.innerHTML = `<i class="fa fa-step-forward fa-2x p-5" data-id="${nextId}" data-type="track" aria-hidden="true"></i>`;
    prevBtn.innerHTML = `<i class="fa fa-step-backward fa-2x p-5" data-id="${prevId}" data-type="track" aria-hidden="true"></i>`;
}
nextBtn.addEventListener('click' , playNext);
function playNext(e)
{
    if(e.target.dataset.id != "undefined")
    {
        songID = e.target.dataset.id;
        clearTimeout(pauseAfterCompletion);
        clearInterval(playNextSong);
        clearInterval(timePLayed);
        playPauseFunc(songID);
    }
}
prevBtn.addEventListener('click' , playPrev);
function playPrev(e)
{
    if(e.target.dataset.id != "undefined")
    {
        songID = e.target.dataset.id;
        clearTimeout(pauseAfterCompletion);
        clearInterval(playNextSong);
        clearInterval(timePLayed);
        playPauseFunc(songID);
    }
}
contentSection.addEventListener('click' , playAll)
function playAll(e) {
    if(e.target.dataset.type == 'play')
    {
        songID = songList[0];
        playPauseFunc(songID);
    }

}


/*******************************LOGOUT FUNCTIONs************************************* */
logoutBtn.addEventListener('click' , logoutFunc)
function logoutFunc() 
{
    window,location.reload(true);
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    loginpage.style.display = 'block';
    mainpage.style.display = 'none';   
    footer.style.display = 'none';
}


