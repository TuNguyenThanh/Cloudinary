/*--------------------------------------Cloudinary--------------------------------------*/
/*                               https://cloudinary.com                                 */
/*                                                         Dev. Tu Nguyen Thanh         */
/*                                                         Email: thanhtu.dev@gmail.com */
/*--------------------------------------------------------------------------------------*/

// npm install crypto-js --save
import CryptoJS from 'crypto-js'

// Upload image to cloudinary
function uploadImage(uri, progress, response, error) {
    const timestamp = (Date.now() / 1000 | 0).toString();
    const api_key = ''
    const api_secret = ''
    const cloud = ''
    const hash_string = 'timestamp=' + timestamp + api_secret
    const signature = CryptoJS.SHA1(hash_string).toString();
    const upload_url = 'https://api.cloudinary.com/v1_1/' + cloud + '/image/upload'

    let xhr = new XMLHttpRequest();
    xhr.open('POST', upload_url);
    xhr.onload = () => {
      console.log(xhr);
    };

    xhr.upload.addEventListener('progress', function(e) {
      //console.log('progress: ' + (e.loaded * 100/ e.total).toFixed(2) + '%');
      progress(parseFloat(e.loaded * 100/ e.total).toFixed(2))
    }, false);

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status === 200) {
        response(xhr.responseText)
        // console.log('success', xhr.responseText);
      } else {
        console.log('errors');
        console.log(xhr);
        error('errors')
      }
    };

    let formdata = new FormData();
    formdata.append('file', { uri: uri, type: 'image/png', name: 'upload.png' });
    formdata.append('timestamp', timestamp);
    formdata.append('api_key', api_key);
    formdata.append('signature', signature);
    xhr.send(formdata);
}

// Delete image to cloudinary
function deleteImage(publicId) {
  const timestamp = (Date.now() / 1000 | 0).toString();
  const api_key = ''
  const api_secret = ''
  const cloud = ''
  const delete_url = 'https://api.cloudinary.com/v1_1/' + cloud + '/image/destroy';

  const hash_string = 'public_id='+ publicId + '&timestamp=' + timestamp + api_secret
  const signature = CryptoJS.SHA1(hash_string).toString();

  let xhr = new XMLHttpRequest();
  xhr.open('POST', delete_url);
  xhr.onload = () => {
    console.log(xhr);
  };

  xhr.onreadystatechange = (e) => {
    if (xhr.readyState !== 4) {
      return;
    }

    if (xhr.status === 200) {
      console.log(xhr.responseText)
      // console.log('success', xhr.responseText);
    } else {
      console.log('errors');
      console.log(xhr);
      error('errors')
    }
  };

  let formdata = new FormData();
  formdata.append('public_id', publicId);
  formdata.append('timestamp', timestamp);
  formdata.append('api_key', api_key);
  formdata.append('signature', signature);
  xhr.send(formdata);
}

// Upload multi images to cloudinary - handle Redux Saga response
// import { buffers, eventChannel, END } from 'redux-saga'
function uploadMultiImages(arrImages) {
  return eventChannel(emitter => {
    let listPhoto = []
    let arrProgress = []
    let error = []
    let countPhoto = arrImages.length
    let uploadPhoto = 0

    for(let i=0; i<countPhoto; i++) {
      arrProgress[i] = 0
    }

    for(let i=0; i<countPhoto; i++) {
      console.log(uploadPhoto);
      uploadImage(arrImages[i].path, (progress) => {
        console.log(i + '-----')
        arrProgress[i] = progress
        emitter({ progress: arrProgress })
      }, (response) => {
        console.log(response)
        listPhoto[i] = response
        uploadPhoto++

        if(uploadPhoto == countPhoto) {
          emitter({ success: listPhoto })
          emitter(END)
          // console.log(arrProgress);
          // console.log(listPhoto);
        }
      }, (error) => {
        error[i] = error
        console.log(error)
        uploadPhoto++
      })
    }

    return () => {}
  }, buffers.sliding(2))
}

// Upload multi images to cloudinary - handle Redux Saga response
// import { call, put, take } from 'redux-saga/effects'
export function * createPostWithMultiImages (postApi, uploadApi, action) {
  try {
    const { arrImagesUpload } = action
    const channel = yield call(uploadMultiImages, arrImagesUpload)
    while (true) {
      const { progress = 0, err, success } = yield take(channel);
      if (err) {
        console.log(err);
        //yield put(PostActions.createPostFailure(err));
        return;
      }
      if (success) {
        console.log(success);
        //yield put(PostActions.createPostSuccess());

        /****************
          Call Other Api
        *****************/
        return;
      }
      console.log(progress);

      // Calculate % progress upload
      let total = 0
      for(let i=0; i<progress.length; i++) {
        total += parseFloat(progress[i])
      }
      console.log((total / progress.length).toFixed(2) + '%')
      //yield put(PostActions.createPostProgress((total / progress.length).toFixed(2) + '%'));
    }
  }
}
