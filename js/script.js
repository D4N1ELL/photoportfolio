var prevScrollpos = window.pageYOffset;
window.onscroll = function() {
  var currentScrollPos = window.pageYOffset;
  if (prevScrollpos > currentScrollPos) {
    document.getElementById("navbar").style.top = "0";
  } else {
    document.getElementById("navbar").style.top = "-75px";
  }
  prevScrollpos = currentScrollPos;
}

const overlay = document.createElement('div')
overlay.style.background = 'rgba(255, 255, 255, 0.7)'
overlay.style.position = 'fixed'
overlay.style.left = '0'
overlay.style.top = '0'
overlay.style.width = '100%'
overlay.style.height = '100%'
overlay.style.zIndex = '9998'
overlay.style.transition = '0.2s ease-out opacity'
overlay.style.backdropFilter = 'blur(2px)'
overlay.style.webkitBackdropFilter = 'blur(2px)'
overlay.style.opacity = '0'
overlay.style.pointerEvents = 'none'

document.body.appendChild(overlay)

let activeZoom = null

document.querySelectorAll('img').forEach(setupZoomableImage)
overlay.addEventListener('click', zoomOut)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    zoomOut()
  }
})

function setupZoomableImage(image) {
  image.style.transition = '0.2s ease-out opacity'
  image.style.cursor = 'zoom-in'
  image.addEventListener('click', toggleZoom)

  function toggleZoom() {
    if (activeZoom && activeZoom.originalImage === image) {
      zoomOut()
      return
    }
    if (activeZoom) {
      zoomOut()
    }

    const rect = image.getBoundingClientRect()

    const zoomedImage = image.cloneNode(true)
    zoomedImage.style.position = 'fixed'
    zoomedImage.style.left = `${rect.left}px`
    zoomedImage.style.top = `${rect.top}px`
    zoomedImage.style.width = `${rect.width}px`
    zoomedImage.style.height = `${rect.height}px`
    zoomedImage.style.objectFit = 'contain'
    zoomedImage.style.zIndex = '9999'
    zoomedImage.style.transition = '0.2s ease-out all'
    zoomedImage.style.cursor = 'zoom-out'

    document.body.appendChild(zoomedImage)

    const viewportPadding = 24
    const maxWidth = window.innerWidth - viewportPadding * 2
    const maxHeight = window.innerHeight - viewportPadding * 2
    const naturalWidth = image.naturalWidth || rect.width
    const naturalHeight = image.naturalHeight || rect.height
    const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight)
    const targetWidth = naturalWidth * scale
    const targetHeight = naturalHeight * scale

    requestAnimationFrame(() => {
      zoomedImage.style.left = `${(window.innerWidth - targetWidth) / 2}px`
      zoomedImage.style.top = `${(window.innerHeight - targetHeight) / 2}px`
      zoomedImage.style.width = `${targetWidth}px`
      zoomedImage.style.height = `${targetHeight}px`
    })

    zoomedImage.addEventListener('click', zoomOut)

    image.style.opacity = '0'
    image.style.cursor = 'zoom-out'

    activeZoom = { originalImage: image, zoomedImage }
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'auto'
    document.body.style.overflow = 'hidden'
  }
}

function zoomOut() {
  if (!activeZoom) {
    return
  }

  const { originalImage, zoomedImage } = activeZoom

  if (zoomedImage && zoomedImage.parentNode) {
    zoomedImage.parentNode.removeChild(zoomedImage)
  }

  originalImage.style.opacity = ''
  originalImage.style.cursor = 'zoom-in'
  overlay.style.opacity = '0'
  overlay.style.pointerEvents = 'none'
  document.body.style.overflow = ''
  activeZoom = null
}
