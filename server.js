const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const rootDir = path.join(__dirname, 'users');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
// Add this line to serve the images
app.use('/users', express.static('users'));


app.use(express.static(path.join(__dirname, 'public')));


app.get('/videos', (req, res) => {
  const usersPath = path.join(__dirname, 'users');
  const users = fs.readdirSync(usersPath);

  let videoData = [];

  users.forEach((user) => {
    const userPath = path.join(usersPath, user, 'posts');
    const posts = fs.readdirSync(userPath);

    posts.forEach((post) => {
      const postPath = path.join(userPath, post);
      const postContent = fs.readFileSync(postPath, 'utf8');
      const postData = JSON.parse(postContent);

      videoData.push(postData);
    });
  });

  shuffleArray(videoData); // Shuffling the videoData array

  const videoContent = generateVideoContent(videoData);
  res.send(videoContent);
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function generateVideoContent(videoData) {
  let videoHTML = `
    <div class="mainbody">
      <div class="videos">
        <h1>Recommended</h1>
        <div class="videos_container">
  `;

  videoData.forEach((videoItem) => {
    const video = videoItem;
    const key = video.key;
    const title = video.title || 'No title available';
    const username = video.username || 'Unknown user';
    const likes = video.likes || 0;
    const uploadedTime = video.uploadedTime || 'No upload time available';

    const thumbnail = video.imageFile || ''; // Provide a placeholder if no image is available
    const profileUser = video.profileImg ? `users/${video.username}/images/profile/profile.png` : 'default_profile_image_path.jpg'; // Provide a placeholder if no image is available

    videoHTML += `
      <div class="video" onclick=sendDataToServer(this,'${key}')>
        <div class="video_thumbnail">
          <img src="${thumbnail}" alt="video-thumbnail">
        </div>
        <div class="video_details">
          <div class="author">
            <img src="${profileUser}" alt="author">
          </div>
          <div class="title">
            <h3 class="titleText">${title}</h3>
            <a href="#">${username}</a>
            <span>${likes} likes ∙ ${uploadedTime}</span>
          </div>
        </div>
      </div>
    `;
  });

  videoHTML += `
        </div>
      </div>
    </div>
  `;

  return videoHTML;
}








app.post('/updateHomeSection', (req, res) => {
  const key = req.body.key;
  console.log('Received key:', key);
  res.redirect(`/player?key=${key}`);
});










app.post('/sendVideoData', (req, res) => {
  const key = req.body.key;
  let foundData = [];

  fs.readdir(rootDir, (err, usernames) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.send('Error reading directory');
    } else {
      let isKeyFound = false;
      usernames.forEach((username) => {
        const postsDir = path.join(rootDir, username, 'posts');
        fs.readdir(postsDir, (err, files) => {
          if (err) {
            console.error('Error reading directory:', err);
            res.send('Error reading directory');
          } else {
            files.forEach((file) => {
              if (file.includes(key)) {
                const filePath = path.join(postsDir, file);
                fs.readFile(filePath, 'utf8', (err, data) => {
                  if (err) {
                    console.error('Error reading file:', err);
                    res.send('Error reading file');
                  } else {
                    const jsonData = JSON.parse(data);
                    foundData.push(jsonData);
                    isKeyFound = true;
                  }
                });
              }
            });
          }
        });
      });

      // Send the response after checking all files
      setTimeout(() => {
        if (isKeyFound) {
          res.send(foundData);
        } else {
          res.send('Key not found');
        }
      }, 1000);
    }
  });
});







app.use(express.json());


app.post('/saveUserData', (req, res) => {
  const userData = req.body;
  const { username } = userData;

  // Check if the username already exists
  const usersFolderPath = path.join(__dirname, 'users');
  const existingUsers = fs.readdirSync(usersFolderPath);
  if (existingUsers.includes(username)) {
    res.send('Username already exists. Please choose a different username.');
    return;
  }

  // Create a folder for the user
  const userFolder = path.join(usersFolderPath, username);
  fs.mkdirSync(userFolder, { recursive: true });

  // Create a userlogindata.txt file with the user's data
  const userDataFilePath = path.join(userFolder, 'userlogindata.txt');
  fs.writeFile(userDataFilePath, JSON.stringify(userData, null, 2), (err) => {
    if (err) {
      console.error('Error writing file:', err);
      res.send('Error writing file');
    } else {
      console.log('User data saved successfully');
      res.send('User data saved successfully');
    }
  });
});







app.post('/login', (req, res) => {
  const { username, loginemail, loginPassword } = req.body;
  const filePath = path.join(__dirname, `users/${username}/userlogindata.txt`);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.send('Failure');
    } else {
      const userData = JSON.parse(data);
      if (userData.emailAdress === loginemail && userData.password === loginPassword) {
        res.send('Success');
      } else {
        res.send('Failure');
      }
    }
  });
});








app.post('/addVideo', (req, res) => {
  const { title } = req.body;
  const username = req.headers.username;
  const postsFolderPath = path.join(__dirname, `users/${username}/posts`);
  const videosFolderPath = path.join(__dirname, `users/${username}/videos`);
  const imagesFolderPath = path.join(__dirname, `users/${username}/images`);

  if (!fs.existsSync(postsFolderPath)) {
    fs.mkdirSync(postsFolderPath, { recursive: true });
  }

  if (!fs.existsSync(videosFolderPath)) {
    fs.mkdirSync(videosFolderPath, { recursive: true });
  }

  if (!fs.existsSync(imagesFolderPath)) {
    fs.mkdirSync(imagesFolderPath, { recursive: true });
  }

  if (req.files && req.files.videoFile && req.files.imageFile) {
    const Generatekey = generateRandomKey();
    const videoFile = req.files.videoFile;
    const imageFile = req.files.imageFile;
    const fileExtension = path.extname(videoFile.name);
    const videoFileName = `${Generatekey}${fileExtension}`;
    const imageFileName = `${Generatekey}${path.extname(imageFile.name)}`;
    const videoFileDestination = path.join(videosFolderPath, videoFileName);
    const imageFileDestination = path.join(imagesFolderPath, imageFileName);
    videoFile.mv(videoFileDestination, (err) => {
      if (err) {
        console.error('Error moving video file:', err);
        res.send('Error moving video file');
      } else {
        imageFile.mv(imageFileDestination, (err) => {
          if (err) {
            console.error('Error moving image file:', err);
            res.send('Error moving image file');
          } else {
            const postData = {
              title,
              key: Generatekey,
              username,
              likes: 0,
              uploadedTime: new Date().toLocaleString(),
              videoFile: `users/${username}/videos/${videoFileName}`,
              imageFile: `users/${username}/images/${imageFileName}`,
              profileImg: `users/${username}/images/profile/profile.png`
            };

            const postDataPath = path.join(postsFolderPath, `${Generatekey}.json`);
            fs.writeFileSync(postDataPath, JSON.stringify(postData));

            res.send('Video added successfully.');
          }
        });
      }
    });
  } else {
    res.send('No file uploaded.');
  }
});

function generateRandomKey() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  const keyLength = 8;
  for (let i = 0; i < keyLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    key += characters[randomIndex];
  }
  return key;
}









app.post('/profileImgSave', (req, res) => {
  const username = req.body.username;
  const imagesFolderPath = path.join(__dirname, `users/${username}/images/profile`);

  if (!fs.existsSync(imagesFolderPath)) {
    fs.mkdirSync(imagesFolderPath, { recursive: true });
  }

  if (req.files && req.files.photoFile) {
    const photoFile = req.files.photoFile;
    const fileExtension = path.extname(photoFile.name);
    const photoFileName = `profile${fileExtension}`;
    const photoFileDestination = path.join(imagesFolderPath, photoFileName);

    photoFile.mv(photoFileDestination, (err) => {
      if (err) {
        console.error('Error moving photo file:', err);
        res.status(500).send('Error moving photo file');
      } else {
        res.send('Profile photo added successfully.');
      }
    });
  } else {
    res.status(400).send('No file uploaded.');
  }
});
app.get('/getProfileImage', (req, res) => {
  const { username } = req.query;
  const imagePath = path.join(__dirname, `users/${username}/images/profile/profile.png`);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Profile image not found');
  }
});







app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'player.html'));
});
app.get('/loginpage', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
