const navbar = document.getElementById('navbar')

if (navbar) {
  const navToggle = navbar.querySelector('.nav-toggle')

  function updateNavbar() {
    navbar.classList.toggle('scrolled', window.scrollY > 40)
  }

  function setMenuOpen(isOpen) {
    navbar.classList.toggle('open', isOpen)
    navToggle.setAttribute('aria-expanded', String(isOpen))
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu')
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }

  updateNavbar()
  window.addEventListener('scroll', updateNavbar, { passive: true })

  navToggle.addEventListener('click', () => {
    setMenuOpen(!navbar.classList.contains('open'))
  })

  navbar.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false))
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navbar.classList.contains('open')) {
      setMenuOpen(false)
    }
  })

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navbar.classList.contains('open')) {
      setMenuOpen(false)
    }
  })
}

// How long the blurred background takes to fade in when opening,
// and how long the preview and background take to fade out when closing
const openFadeDuration = 100
const closeFadeDuration = 500

const overlay = document.createElement('div')
overlay.style.background = 'rgba(255, 255, 255, 0.7)'
overlay.style.position = 'fixed'
overlay.style.left = '0'
overlay.style.top = '0'
overlay.style.width = '100%'
overlay.style.height = '100%'
overlay.style.zIndex = '9998'
overlay.style.transition = `${openFadeDuration}ms ease-out opacity`
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
  } else if (event.key === 'ArrowRight') {
    showAdjacentImage(1)
  } else if (event.key === 'ArrowLeft') {
    showAdjacentImage(-1)
  }
})

// Swipe left/right on touch screens to cycle photos while one is open
let swipeStart = null

document.addEventListener('touchstart', (event) => {
  if (!activeZoom || event.touches.length !== 1) {
    swipeStart = null
    return
  }
  swipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }
}, { passive: true })

document.addEventListener('touchend', (event) => {
  if (!swipeStart) {
    return
  }
  const deltaX = event.changedTouches[0].clientX - swipeStart.x
  const deltaY = event.changedTouches[0].clientY - swipeStart.y
  swipeStart = null

  // Ignore short or mostly vertical swipes so a sloppy tap doesn't change photo
  if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) {
    return
  }
  event.preventDefault()
  showAdjacentImage(deltaX < 0 ? 1 : -1)
})

// Prev/next arrows while a photo is open (mouse only, touch screens swipe instead):
// hidden at first, fade in when the cursor moves near the left/right edge,
// fade out again once the cursor stops moving
const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const zoomArrows = hasMouse ? [createZoomArrow('prev', -1), createZoomArrow('next', 1)] : []
const arrowEdgeZone = 0.49
const arrowIdleDelay = 1000
let arrowIdleTimer = null

function createZoomArrow(direction, step) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `zoom-arrow zoom-arrow--${direction}`
  button.setAttribute('aria-label', step > 0 ? 'Next photo' : 'Previous photo')
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    showAdjacentImage(step)
  })
  document.body.appendChild(button)
  return button
}

function hideZoomArrows(keepHovered) {
  zoomArrows.forEach((arrow) => {
    // Don't pull an arrow away from under a cursor resting on it, so it can still be clicked
    if (!(keepHovered && arrow.matches(':hover'))) {
      arrow.classList.remove('visible')
    }
  })
}

if (hasMouse) {
  document.addEventListener('mousemove', (event) => {
    if (!activeZoom || activeZoom.isClosing || !activeZoom.originalImage.closest('.portfoliocontainer')) {
      return
    }
    const edge = window.innerWidth * arrowEdgeZone
    zoomArrows[0].classList.toggle('visible', event.clientX < edge)
    zoomArrows[1].classList.toggle('visible', event.clientX > window.innerWidth - edge)

    clearTimeout(arrowIdleTimer)
    arrowIdleTimer = setTimeout(() => hideZoomArrows(true), arrowIdleDelay)
  })
}

function setupZoomableImage(image) {
  image.style.cursor = 'pointer'
  image.addEventListener('click', toggleZoom)

  function toggleZoom() {
    if (activeZoom && activeZoom.originalImage === image) {
      zoomOut()
      return
    }
    if (activeZoom) {
      zoomOut()
    }

    zoomIn(image, true)
  }
}

function zoomIn(image, animate) {
  const rect = image.getBoundingClientRect()

  const zoomedImage = image.cloneNode(true)
  zoomedImage.style.position = 'fixed'
  zoomedImage.style.left = `${rect.left}px`
  zoomedImage.style.top = `${rect.top}px`
  zoomedImage.style.width = `${rect.width}px`
  zoomedImage.style.height = `${rect.height}px`
  zoomedImage.style.objectFit = 'contain'
  zoomedImage.style.zIndex = '9999'
  zoomedImage.style.cursor = 'default'
  zoomedImage.loading = 'eager'

  document.body.appendChild(zoomedImage)

  function fitToViewport() {
    const viewportPadding = 24
    const maxWidth = window.innerWidth - viewportPadding * 2
    const maxHeight = window.innerHeight - viewportPadding * 2
    const naturalWidth = zoomedImage.naturalWidth || rect.width
    const naturalHeight = zoomedImage.naturalHeight || rect.height
    const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight)
    const targetWidth = naturalWidth * scale
    const targetHeight = naturalHeight * scale

    zoomedImage.style.left = `${(window.innerWidth - targetWidth) / 2}px`
    zoomedImage.style.top = `${(window.innerHeight - targetHeight) / 2}px`
    zoomedImage.style.width = `${targetWidth}px`
    zoomedImage.style.height = `${targetHeight}px`
  }

  // A lazy-loaded photo may not have its real size yet, so refit once it loads
  if (!zoomedImage.complete || !zoomedImage.naturalWidth) {
    zoomedImage.addEventListener('load', fitToViewport, { once: true })
  }

  if (animate) {
    zoomedImage.style.transition = '0.1s ease-out all'
    requestAnimationFrame(fitToViewport)
  } else {
    // Cycling with the arrow keys: show the next photo in place, animate only the close
    fitToViewport()
    requestAnimationFrame(() => {
      zoomedImage.style.transition = '0.1s ease-out all'
    })
  }

  zoomedImage.addEventListener('click', zoomOut)

  activeZoom = { originalImage: image, zoomedImage, isClosing: false }
  overlay.style.transitionDuration = `${openFadeDuration}ms`
  overlay.style.opacity = '1'
  overlay.style.pointerEvents = 'auto'
  document.body.style.overflow = 'hidden'
}

function showAdjacentImage(step) {
  if (!activeZoom || activeZoom.isClosing) {
    return
  }

  const { originalImage, zoomedImage } = activeZoom
  const gallery = originalImage.closest('.portfoliocontainer')
  if (!gallery) {
    return
  }

  const images = Array.from(gallery.querySelectorAll('img'))
  const nextImage = images[(images.indexOf(originalImage) + step + images.length) % images.length]

  zoomedImage.remove()

  zoomIn(nextImage, false)
}

function zoomOut() {
  if (!activeZoom) {
    return
  }

  if (activeZoom.isClosing) {
    return
  }

  const closingZoom = activeZoom
  const { zoomedImage } = closingZoom
  closingZoom.isClosing = true

  clearTimeout(arrowIdleTimer)
  hideZoomArrows(false)

  // Quick fade out where it is, together with the blur, revealing the grid again
  zoomedImage.style.pointerEvents = 'none'
  zoomedImage.style.transition = `opacity ${closeFadeDuration}ms ease-out`
  zoomedImage.style.opacity = '0'

  overlay.style.transitionDuration = `${closeFadeDuration}ms`
  overlay.style.opacity = '0'
  overlay.style.pointerEvents = 'none'
  document.body.style.overflow = ''

  let didFinish = false

  function finishZoomOut() {
    if (didFinish) {
      return
    }
    didFinish = true

    if (zoomedImage && zoomedImage.parentNode) {
      zoomedImage.parentNode.removeChild(zoomedImage)
    }

    // A new photo may have been opened while this one was still fading out
    if (activeZoom === closingZoom) {
      activeZoom = null
    }
  }

  zoomedImage.addEventListener('transitionend', finishZoomOut, { once: true })
  setTimeout(finishZoomOut, closeFadeDuration)
}
