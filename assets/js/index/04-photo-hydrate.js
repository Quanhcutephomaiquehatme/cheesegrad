document.querySelectorAll('img[data-photo]').forEach(img=>{
 const photo=window.CHEESE_PHOTOS[Number(img.dataset.photo)];
 img.src=photo.src;
});
