var config = {
      apiKey: "AIzaSyBBmvxKIyXz_SnNqKIQljm2kbl1AeZZgrE",
      authDomain: "audio-note-pro.firebaseapp.com",
      databaseURL: "https://audio-note-pro.firebaseio.com",
      storageBucket: "audio-note-pro.appspot.com",
      messagingSenderId: "1014839766664"
    };
firebase.initializeApp(config);

firebase.auth().onAuthStateChanged(u => {
  if (u) {
    user = u;
    userId = u.uid;
    firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
      var name = snapshot.val().name;
      if(snapshot.val().allFiles){
        var files = snapshot.val().allFiles;
        allFiles = files.split("||");
      }
      if(snapshot.val().YTFiles){
        var files = snapshot.val().YTFiles;
        ytFiles = files.split("||");
      }
      if(snapshot.val().favorites){
        var files = snapshot.val().favorites;
        favorites = files.split("||");
      }
      $("#table").find("tr:gt(0)").remove();
      $("#welcome").text(name);
      
      allFiles.forEach(function(elem){
        if(elem!==''){
          var img = "";
          if(favorites.includes(elem)){img = fullStar;}else{img = emptyStar;}
          counter = "star" + elem;
          $('#table').append( "<tr><td id='" + elem + "' onclick=playAudio(this.id)><a><img src='mp3.png' /></a><h4 id='center'>" + elem + "</h4></td><td><img id='" + counter + "' style='height:25px;width:25px;' onclick=switchStar(this.id) src='" + img + "'></td></tr>" );
        }
      });
      ytFiles.forEach(function(elem){
        var z = elem + "fav";
        if(elem!==''){
          var img = "";
          if(favorites.includes(elem)){img = fullStar;}else{img = emptyStar;}
          var counter = "star" + elem;
          $('#table').append( "<tr><td id='" + elem + "' onclick=playYT(this.id)><a><img src='ytlogo.png' style='height:25px;width:35px;margin:7px;'/></a><h4 id='center'>" + elem + "</h4></td><td><img id='" + counter + "' style='height:25px;width:25px;' onclick=switchStar(this.id) src='" + img + "'></td></tr>" );
        }
      });
      $(".loader").hide();
    });
  } else {
    window.location.href = 'index.html';
  }
});

$("#backButton").hide();
$(".player").hide();
var user = firebase.auth().currentUser;
var userId;
var SignoutButton = $("#SignoutButton");
var allFiles = [];
var ytFiles = [];
var favorites = [];
var selector = [];
var map = {};
var uploading = false;

// Get the modal
var modal = document.getElementById('myModal');
var deleteModal = document.getElementById('deleteModal');
var editModal = document.getElementById('editModal');
var ytModal = document.getElementById('ytModal');
var span = $(".close");

var database = firebase.database();

var audio = document.getElementById('audio');
var source = document.getElementById('mp3Source');


var fileButton = $("#fileChooser");
var fileInput = $("#fileName");
var ytFileName = $("#ytFileName");
var uploadButton = $("#uploadButton");
var uploader = $("#uploader");
var createButton = $("#createButton");
var fae = $("#fae");
var ytLink = $("#ytLink");
fae.hide();
$("#noResultFound").hide();
var loader = $(".loader");

var emptyStar = "emptystar.png";
var fullStar = "fullstar.png";

fileButton.change(function(e){
  var file = e.target.files[e.target.files.length-1];
  fileInput.val(file.name.replace(".mp3", "").trim());
  uploadButton.click(function(){
    fae.hide();
    if(valid(fileInput.val().trim())){
      uploading = true;
      var storageRef = firebase.storage().ref(userId+"/"+ fileInput.val().trim());
      var task = storageRef.put(file);
      task.on('state_changed', function progress(snapshot){
        var percentage = (snapshot.bytesTransferred/snapshot.totalBytes)*100;
        uploader.val(percentage);
      },
      function error(err){

      },
      function complete(){
        if(valid(fileInput.val().trim()))
        {
          allFiles.push(fileInput.val().trim());
          var adaNameRef = firebase.database().ref('users/' + userId + '');
          adaNameRef.child('allFiles').set(getFiles(allFiles));
          uploader.val(0);
          fileButton.val(null);
          storageRef.getDownloadURL().then(function(url) {
            var nameRef = firebase.database().ref('users/' + userId + '/audioFiles/'+fileInput.val());
            nameRef.child('audioURL').set(url);
            fileInput.val("");
            modal.style.display = "none";
            loadListView();
            uploading = false;
          });
        }
      });
    }
    else
    {
      fae.show();
    }
  });
});

function createYT(){
  if(valid(ytFileName.val().trim()) && validLink(ytLink.val().trim())){
    uploading = true;
    ytFiles.push(ytFileName.val().trim());
    var adaNameRef = firebase.database().ref('users/' + userId + '');
    adaNameRef.child('YTFiles').set(getFiles(ytFiles));
    var video_id = ytLink.val().trim().split('v=')[1];
    var ampersandPosition = video_id.indexOf('&');
    if(ampersandPosition != -1) {
      video_id = video_id.substring(0, ampersandPosition);
    }
    var nameRef = firebase.database().ref('users/' + userId + '/youtubeFiles/'+ytFileName.val());
    nameRef.child('id').set(video_id);
    ytModal.style.display = "none";
    loadListView();
    uploading = false;
  }
  else{
    console.log("Did not enter");
  }
}

function valid(file){
  console.log("Came here 1");
  if(file.length === 0){
    console.log("return false");
    return false;
  }
  return !allFiles.includes(file) && !ytFiles.includes(file);
}

function validLink(url){
  console.log("came here 2");
  if (url != undefined || url != '') {
      var regExp = /^.*(youtube.com\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
      var match = url.match(regExp);
      if (match && match[2].length == 11) {
        console.log("return true");
        return true;
      }
      else {
        console.log("return false");
        return false;
      }
  }
}

function switchStar(id){
  var x = id.replace("star", "");
  if(document.getElementById(id).src.includes(emptyStar)){
    document.getElementById(id).src = fullStar;
    favorites.push(x);
  }
  else{
    document.getElementById(id).src = emptyStar;
    favorites = remove(x, favorites);
  }
  var adaNameRef = firebase.database().ref('users/' + userId + '');
  adaNameRef.child('favorites').set(getFiles(favorites));
}

SignoutButton.click(function(){
  firebase.auth().signOut();
  window.location.href = 'index.html';
});

function getFiles(arr){
  var a = "";
  arr.forEach(function(elem){
    if(elem !== ''){
      a+=elem+"||";
    }
  });
  return a;
}

function liveSearch(){
  $("#table").find("tr:gt(0)").remove();
  loader.show();
  delay(function(){
    var s = $("#search").val().trim();
    if(s !==''){
      s = s.toLowerCase();
      $("#noResultFound").hide();
      loader.show();
      searchForFile(s);
      loader.hide();
    }
    else{
      $("#noResultFound").hide();
      loadListView();
    }
    }, 200 );
  loader.hide();
}

var delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

function searchForFile(file){
  $("#table").find("tr:gt(0)").remove();
  $("#noResultFound").hide();
  if(!file.includes("|")){
    allFiles.forEach(function(elem){
      var x = "";
      if(elem.toLowerCase().includes(file)){
        var img = "";
        if(favorites.includes(elem)){img = fullStar;}else{img = emptyStar;}
        counter = "star" + elem;
        $('#table').append( "<tr><td id='" + elem + "' onclick=playAudio(this.id)><a><img src='mp3.png' /></a><h4 id='center'>" + elem + "</h4></td><td><img id='" + counter + "' style='height:25px;width:25px;' onclick=switchStar(this.id) src='" + img + "'></td></tr>" );
      }
      else{
        firebase.database().ref('/users/' + userId + '/audioFiles/'+elem).once('value').then(function(snapshot) {
          var ns = snapshot.val().notes.toLowerCase();
          if(ns!==undefined){
            getNotesFromDB(ns);
            x = getAllNotes().toLowerCase();
            if(elem.toLowerCase().includes(file) || x.includes(file)){
              var img = "";
              if(favorites.includes(elem)){img = fullStar;}else{img = emptyStar;}
              counter = "star" + elem;
              $('#table').append( "<tr><td id='" + elem + "' onclick=playAudio(this.id)><a><img src='mp3.png' /></a><h4 id='center'>" + elem + "</h4></td><td><img id='" + counter + "' style='height:25px;width:25px;' onclick=switchStar(this.id) src='" + img + "'></td></tr>" );
            }
          }
        });
      }
    });
    ytFiles.forEach(function(elem){
      var x = "";
      if(elem.toLowerCase().includes(file)){
        var img = "";
        if(favorites.includes(elem)){img = fullStar;}else{img = emptyStar;}
        var counter = "star" + elem;
        $('#table').append( "<tr><td id='" + elem + "' onclick=playYT(this.id)><a><img src='ytlogo.png' style='height:25px;width:35px;margin:7px;'/></a><h4 id='center'>" + elem + "</h4></td><td><img id='" + counter + "' style='height:25px;width:25px;' onclick=switchStar(this.id) src='" + img + "'></td></tr>" );
      }
      else{
        firebase.database().ref('/users/' + userId + '/youtubeFiles/'+elem).once('value').then(function(snapshot) {
          var ns = snapshot.val().notes.toLowerCase();
          if(ns!==undefined){
            getNotesFromDB(ns);
            x = getYTNotes().toLowerCase();
            if(elem.toLowerCase().includes(file) || x.includes(file)){
              var img = "";
              if(favorites.includes(elem)){img = fullStar;}else{img = emptyStar;}
              var counter = "star" + elem;
              $('#table').append( "<tr><td id='" + elem + "' onclick=playYT(this.id)><a><img src='ytlogo.png' style='height:25px;width:35px;margin:7px;'/></a><h4 id='center'>" + elem + "</h4></td><td><img id='" + counter + "' style='height:25px;width:25px;' onclick=switchStar(this.id) src='" + img + "'></td></tr>" );
            }
          }
        });
      }
    });
  }
  else{
    $("#noResultFound").hide();
  }
}

function clearSearch(){
  $("#search").val("");
  loadListView();
}

function loadListView(){
  $("#table").find("tr:gt(0)").remove();
  allFiles.forEach(function(elem){
    if(elem!==''){
      var img = "";
      if(favorites.includes(elem)){img = fullStar;}else{img = emptyStar;}
      counter = "star" + elem;
      $('#table').append( "<tr><td id='" + elem + "' onclick=playAudio(this.id)><a><img src='mp3.png' /></a><h4 id='center'>" + elem + "</h4></td><td><img id='" + counter + "' style='height:25px;width:25px;' onclick=switchStar(this.id) src='" + img + "'></td></tr>" );
    }
  });
  ytFiles.forEach(function(elem){
    if(elem!==''){
      var img = "";
      if(favorites.includes(elem)){img = fullStar;}else{img = emptyStar;}
      var counter = "star" + elem;
      $('#table').append( "<tr><td id='" + elem + "' onclick=playYT(this.id)><a><img src='ytlogo.png' style='height:25px;width:35px;margin:7px;'/></a><h4 id='center'>" + elem + "</h4></td><td><img id='" + counter + "' style='height:25px;width:25px;' onclick=switchStar(this.id) src='" + img + "'></td></tr>" );
    }
  });
}

function playAudio(id){
  $(".li").hide();
  $(".searchBar").hide();
  $(".menu").hide();
  $("#backButton").show();
  $(".player").show();
  $("#title").text(id);
  $("#head").hide();
  $(".mainpage").hide();
  map={};
  $("#noteList").empty();
  setAudio(id);
}

function setAudio(id){
  firebase.database().ref('/users/' + userId + '/audioFiles/'+id).once('value').then(function(snapshot) {
      var url = snapshot.val().audioURL;
      var ns = snapshot.val().notes;
      if(ns!==undefined){
        getNotesFromDB(ns);
        loadNoteListView();
      }
      source.src=url;
      audio.load(); //call this to just preload the audio without playing
      audio.play();
  });
}

function goBack(){
  $(".li").show();
  $(".searchBar").show();
  $(".menu").show();
  $("#backButton").hide();
  $(".player").hide();
  $("#head").show();
  $(".mainpage").show();
  audio.pause();
  map = {};
}

function createFile(){
  modal.style.display = "block";
}

function createYoutube(){
  ytModal.style.display = "block";
}

function deleteFile(){
  selector = [];
  deleteModal.style.display = "block";
  $("#confirmation").hide();
  $("#selector").empty();
  allFiles.forEach(function(elem){
    if(elem!==''){
      selector.push(elem);
      var opt = document.createElement('option');
      opt.text = elem;
      document.getElementById("selector").appendChild(opt);
    }
  });
  ytFiles.forEach(function(elem){
    selector.push(elem);
    if(elem!==''){
      var opt = document.createElement('option');
      opt.text = elem;
      document.getElementById("selector").appendChild(opt);
    }
  });
}

function deleteAlert(){
  var i = document.getElementById("selector").selectedIndex;
  var temp = selector[i];
  if(temp!= undefined){
    $("#confirmation").show();
    $("#confText").text(temp + " will be deleted. Are you sure?");
    $("#no").click(function(){
      $("#confirmation").hide();
    });
    $("#yes").click(function(){
      if(allFiles.includes(temp)){
        var storage = firebase.storage();
        var storageRef = storage.ref();
        var desertRef = storageRef.child(userId + '/' + temp);

        desertRef.delete().then(function() {
          console.log("delete successful");
          allFiles = remove(temp, allFiles);
          var adaNameRef = firebase.database().ref('users/' + userId + '');
          adaNameRef.child('allFiles').set(getFiles(allFiles));
          firebase.database().ref('users/' + userId + "/audioFiles/" + temp).remove();
          loadListView();
        }).catch(function(error) {
          console.log("Uh-oh, an error occurred: " + error);
        });
      }
      else{
        var adaNameRef = firebase.database().ref('users/' + userId + '');
        ytFiles = remove(temp, ytFiles);
        firebase.database().ref('users/' + userId + "/youtubeFiles/" + temp).remove();
        adaNameRef.child('YTFiles').set(getFiles(ytFiles));
      }
      deleteModal.style.display = "none";
      favorites = remove(temp, favorites);
      loadListView();
      var adaNameRef = firebase.database().ref('users/' + userId + '');
      adaNameRef.child('favorites').set(getFiles(favorites));
      
    });
  }
}

function addNote(){
  var s = $("#noteInput").val().trim();
  if(s !== ''){
    if(map[$("#timer").text()]==undefined){
      map[$("#timer").text()] = s;
    }
    else{
      map[$("#timer").text()] = map[$("#timer").text()] + "\n" +  s;
    }
    loadNoteListView();
    var nameRef = firebase.database().ref('users/' + userId + '/audioFiles/'+ $("#title").text());
    nameRef.child('notes').set(getAllNotes());
    $("#noteInput").val("");
    $("#timer").text("");
    audio.play();
  }
}

function getAllNotes(){
  var x = "";
  for(var key in map){
    if(key!==""){
      x += key + "|||" + map[key] + "|||||";
    }
  }
  return x;
}

function getNotesFromDB(id){
  map = {};
  var a = id.split("|||||");
  for(var n in a){
    if(a[n]!== ''){
      var z = a[n].split("|||");
      map[z[0]] = z[1];
    }
  }
}

function loadNoteListView(){
  $("#noteList").empty();
  sortMap();
  for(var key in map){
    if(key!==''){
      $("#noteList").append("<li><div class='notes'><div style='display:inline-block;width:50px;height:100%;background-color:#5992DC;padding:10px;margin-right:5px;'><p id='" + key + "' onclick=goTo(this.id) class='time' style='cursor:pointer;'>" + key + "</p></div><p id='" + key + "' onclick=goTo(this.id) class='note' style='cursor:pointer;'>" + map[key] + "</p><button id='" + key + "' class='delete' onclick=deleteNote(this.id) style='float:right;vertical-align:center;'>Delete</button><button id='" + key + "' class='edit' style='float:right;vertical-align:middle;' onclick=editNote(this.id)>Edit</button></div></li>");
    }
  }
} 

function sortMap(){
  var keys = Object.keys(map),i, len = keys.length;
  keys.sort();
  var x = {};
  for (i = 0; i < len; i++) {
    x[keys[i]] = map[keys[i]];
  }
  map = x;
}  

//id = 04:40
function goTo(id){
  var elem = id.split(":");
  var minute = Number(elem[0]) * 60;
  var second = Number(elem[1]); 
  audio.currentTime = minute + second;
}

function deleteNote(id){
  delete map[id];
  var nameRef = firebase.database().ref('users/' + userId + '/audioFiles/'+ $("#title").text());
  nameRef.child('notes').set(getAllNotes());
  loadNoteListView();
}

function editNote(id){
  editModal.style.display = "block";
  $("#editor").val(map[id]);
  currID = id;
}

var currID = "";

$("#edit").click(function(){
  if($("#editor").val() !== ''){
    map[currID] = $("#editor").val();
    console.log(map);
    var nameRef = firebase.database().ref('users/' + userId + '/audioFiles/'+ $("#title").text());
    nameRef.child('notes').set(getAllNotes());
    loadNoteListView();
    editModal.style.display = "none";
  }
});

function cancelEdit(){
  editModal.style.display = "none";
}

function pauseAudio(){
  if($("#noteInput").val() !== ""){
    if(!$("#continue").is(':checked')){
      audio.pause();
    }
    if($("#timer").text() === ""){
      var time = audio.currentTime;
      var min = (time/60)|0;
      var sec = (time%60)|0;
      var m = min + "";
      var s = sec + "";
      if(min < 10){
        m = "0" + m;
      }
      if(sec < 10){
        s = "0" + s;
      }
      $("#timer").text(m + ":" + s);
    }
  }
  else
  {
    audio.play();
    $("#timer").text("");
  }
} 

function remove(x, arr){
  var a = [];
  arr.forEach(function(elem){
    if(elem!== '' && elem!==x){
      a.push(elem);
    }
  });
  return a;
}

function downloadNotes(){
  var notes = getAllNotes();
  notes = replaceAll(notes, "|||||", "\n");
  notes = replaceAll(notes, "|||", ": ");
  download($("#title").text() + ".txt", notes);
}

function replaceAll(str, find, replace) {
  while(str.includes(find)){
    str = str.replace(find, replace);
  }
  return str;
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

// When the user clicks on <span> (x), close the modal
span.click(function() {
  deleteModal.style.display = "none";
  editModal.style.display = "none";
  if(!uploading){
    modal.style.display = "none";
    ytModal.style.display = "none";
  }
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal || event.target == deleteModal || event.target == editModal || event.target == ytModal) {
    if(!uploading){
      modal.style.display = "none";
      ytModal.style.display = "none";
    }
    deleteModal.style.display = "none";
    editModal.style.display = "none";
  }
}
