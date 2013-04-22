var request = $.ajax({
  url: "shared/slides.txt",
  dataType: "text"
}).done(function(text) {
  var els = document.createElement('div');
  els.innerHTML = text;

  var shared = document.querySelectorAll('slideholder[data-shared-slides]');
  for(var i = 0; i < shared.length; i++) {
    var slideHolder = shared[i];
    var ids = slideHolder.getAttribute('data-shared-slides').split(',');
    ids.forEach(function(id) {
      var slide = els.querySelector('#' + id);
	  if (slide) {
        slideHolder.appendChild(slide);
	  }
    });
  }

  $('#title-h1').html($('title').html());
  
  var src = "images/HTML5_Logo_512.png";
  var el = document.querySelector('.small-logo-template');
  if (el) {
   src = el.getAttribute('data-src');
  }
  if (src) {
    var logos = document.querySelectorAll('.small-logo');
	for(i = 0; i < logos.length; i++) {
	  logos[i].src = src;
	}
  }
  
  src = "images/HTML5_Badge_64.png";
  el = document.querySelector('.big-logo-template');
  if (el) {
   src = el.getAttribute('data-src');
  }
  if (src) {
    logos = document.querySelectorAll('.big-logo');
	for(i = 0; i < logos.length; i++) {
	  logos[i].src = src;
	}
  }
  
  start();
});


function start() {
  Modernizr.load({
    test: !!document.body.classList && !!document.body.dataset,
    nope: ['js/polyfills/classList.min.js', 'js/polyfills/dataset.min.js'],
    complete: function() {
      window.slidedeck = new SlideDeck();
    }
  });
}
