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
      $("#listOfFiles").empty();
      $("#welcome").text(name);
      allFiles.forEach(function(elem){
        if(elem!==''){
          $("#listOfFiles").append("<li id='" + elem + "' onclick=playAudio(this.id)><div id='list'><a><img src='mp3.png' style='border:5px solid #6EBDB7;'/></a><center><h4 id='center'>" + elem + "</h4></center></div></li>");
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
var map = {};
var uploading = false;

// Get the modal
var modal = document.getElementById('myModal');
var deleteModal = document.getElementById('deleteModal');
var editModal = document.getElementById('editModal');
var span = $(".close");

var database = firebase.database();

var audio = document.getElementById('audio');
var source = document.getElementById('mp3Source');


var fileButton = $("#fileChooser");
var fileInput = $("#fileName");
var uploadButton = $("#uploadButton");
var uploader = $("#uploader");
var fae = $("#fae");
fae.hide();
$("#noResultFound").hide();

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
          adaNameRef.child('allFiles').set(getAllFiles());
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


function valid(file){
  if(file.length === 0){
    return false;
  }
  return !allFiles.includes(file);
}


SignoutButton.click(function(){
  firebase.auth().signOut();
  window.location.href = 'index.html';
});

function valid(file){
  if(file.length === 0){
    return false;
  }
  return !allFiles.includes(file);
}

function getAllFiles(){
  var a = "";
  allFiles.forEach(function(elem){
    if(elem !== ''){
      a+=elem+"||";
    }
  });
  return a;
}

$("#file").click(function(){
  console.log($("#file").val());
});

function searchForFile(file){
  $("#listOfFiles").empty();
  $("#noResultFound").hide();
  if(!file.includes("|")){
    allFiles.forEach(function(elem){
      var x = "";
      firebase.database().ref('/users/' + userId + '/audioFiles/'+elem).once('value').then(function(snapshot) {
        var ns = snapshot.val().notes;
        if(ns!==undefined){
          getNotesFromDB(ns);
          x = getAllNotes();
          if(elem.includes(file) || x.includes(file)){
            $("#listOfFiles").append("<li id='" + elem + "' onclick=playAudio(this.id)><div id='list'><a><img src='mp3.png' style='border:5px solid #6EBDB7;'/></a><center><h4 id='center'>" + elem + "</h4></center></div></li>");
          }
        }
      });
    });
  }
  else{
    $("#noResultFound").hide();
  }
}

function liveSearch(){
  var s = $("#search").val();
  if(s.trim()!==''){
    $("#noResultFound").hide();
    searchForFile(s);
  }
  else{
    $("#noResultFound").hide();
    loadListView();
  }
}

function loadListView(){
  $("#listOfFiles").empty();
      allFiles.forEach(function(elem){
          if(elem!==''){
            $("#listOfFiles").append("<li id='" + elem + "' onclick=playAudio(this.id)><div id='list'><a><img src='mp3.png' style='border:5px solid #6EBDB7;'/></a><center><h4 id='center'>" + elem + "</h4></center></div></li>");
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
  audio.pause();
  map = {};
}

function createFile(){
  modal.style.display = "block";
}

function deleteFile(){
  deleteModal.style.display = "block";
  $("#confirmation").hide();
  $("#selector").empty();
  allFiles.forEach(function(elem){
    if(elem!==''){
      var opt = document.createElement('option');
      opt.text = elem;
      document.getElementById("selector").appendChild(opt);
    }
  });
}

function deleteAlert(){
  var i = document.getElementById("selector").selectedIndex;
  var temp = allFiles[i];
  if(temp!= undefined){
    $("#confirmation").show();
    
    $("#confText").text(temp + " will be deleted. Are you sure?");
    $("#no").click(function(){
      $("#confirmation").hide();
    });
    $("#yes").click(function(){
      var storage = firebase.storage();
      var storageRef = storage.ref();
      var desertRef = storageRef.child(userId + '/' + temp);
      desertRef.delete().then(function() {
        console.log("delete successful");
        allFiles = remove(temp);
        loadListView();
        var adaNameRef = firebase.database().ref('users/' + userId + '');
        adaNameRef.child('allFiles').set(getAllFiles());
        firebase.database().ref('users/' + userId + "/audioFiles/" + temp).remove();
        deleteModal.style.display = "none";
      }).catch(function(error) {
        console.log("Uh-oh, an error occurred: " + error);
      });
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
      $("#noteList").append("<li><div class='notes'><div style='display:inline-block;width:50px;height:100%;background-color:#5992DC;padding:10px;margin-right:5px;'><p id='" + key + "' onclick=goTo(this.id) class='time' style='cursor:pointer;'>" + key + "</p></div><p id='" + key + "' onclick=goTo(this.id) class='note' style='cursor:pointer;'>" + map[key] + "</p><button id='" + key + "' class='delete' onclick=deleteNote(this.id) style='float:right;'>Delete</button><button id='" + key + "' class='edit' style='float:right;' onclick=editNote(this.id)>Edit</button></div></li>");
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
    audio.pause();
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
  else
  {
    audio.play();
    $("#timer").text("");
  }
} 

function remove(x){
  var a = [];
  allFiles.forEach(function(elem){
    if(elem!== '' && elem!==x){
      a.push(elem);
    }
  });
  return a;
}

// When the user clicks on <span> (x), close the modal
span.click(function() {
  modal.style.display = "none";
  deleteModal.style.display = "none";
  editModal.style.display = "none";
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal || event.target == deleteModal || event.target == editModal) {
      if(!uploading){
        modal.style.display = "none";
      }
      deleteModal.style.display = "none";
      editModal.style.display = "none";
  }

}
