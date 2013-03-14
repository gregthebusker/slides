var request = $.ajax({
  url: "shared/slides.txt"
}).done(function(text) {
  var els = document.createElement('div');
  els.innerHTML = text;

  var shared = document.querySelectorAll('slideholder[data-shared-slides]');
  for(var i = 0; i < shared.length; i++) {
    var slideHolder = shared[i];
    var ids = slideHolder.getAttribute('data-shared-slides').split(',');
    ids.forEach(function(id) {
      var slide = els.querySelector('#' + id);
      slideHolder.appendChild(slide);
    });
  }

  $('#title-h1').html($('title').html());

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
