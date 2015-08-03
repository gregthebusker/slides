var playlistId, channelId, videoId;

function createButtons() {
  var el = $('#metrics');
  var metrics = 'views,comments,favoritesAdded,favoritesRemoved,likes,dislikes,shares,subscribersGained,subscribersLost';
  var op = $('<option>').val(metrics).html('all');
  el.append(op);
  metrics.split(',').forEach(function(metric) {
    el.append($('<option>').val(metric).html(metric));
  });
  el.change(getDataForVideos);

  var check = $('#normalize');
  check.change(getDataForVideos);
}

// Once the api loads call a function to get the uploads playlist id.
function handleAPILoaded() {
  requestUserUploadsPlaylistId();
  createButtons();
}

//Retrieve the uploads playlist id.
function requestUserUploadsPlaylistId() {
  // https://developers.google.com/youtube/v3/docs/channels/list
  var request = gapi.client.youtube.channels.list({
    // mine: '' indicates that we want to retrieve the channel for the authenticated user.
    mine: '',
    part: 'contentDetails,id'
  });
  request.execute(function(response) {
    playlistId = response.result.items[0].contentDetails.uploads;
    channelId = response.result.items[0].id;
    requestVideoPlaylist(playlistId);
  });
}

// Retrieve a playist of videos.
function requestVideoPlaylist(playlistId, pageToken) {
  $('#video-container').html('');
  var requestOptions = {
    playlistId: playlistId,
    part: 'snippet,id',
    maxResults: 10
  };
  if (pageToken) {
    requestOptions.pageToken = pageToken;
  }
  var request = gapi.client.youtube.playlistItems.list(requestOptions);
  request.execute(function(response) {
    // Only show the page buttons if there's a next or previous page.
    nextPageToken = response.result.nextPageToken;
    var nextVis = nextPageToken ? 'visible' : 'hidden';
    $('#next-button').css('visibility', nextVis);
    prevPageToken = response.result.prevPageToken
    var prevVis = prevPageToken ? 'visible' : 'hidden';
    $('#prev-button').css('visibility', prevVis);

    var playlistItems = response.result.items;
    if (playlistItems) {
      // For each result lets show a thumbnail.
      jQuery.each(playlistItems, function(index, item) {
        createVideoListItem(item.snippet);
      });
      getDataForVideos();
    } else {
      $('#video-container').html('Sorry you have no uploaded videos');
    }
  });
}

// Create a thumbnail for a video snippet.
function createVideoListItem(videoSnippet) {
  var anchor = $('<a href="#">');
  anchor.click({ 'videoId': videoSnippet.resourceId.videoId, 'title': videoSnippet.title }, anchorClicked);
  anchor.html(videoSnippet.title);
  var li = $('<li>');
  li.append(anchor);
  $('#video-container').append(li);
}

function anchorClicked(evt) {
  if (evt) {
    var videoId = evt.data.videoId;
    var title = evt.data.title;
  }
  if (title) {
    $('#title').html('Stats for: ' + title);
  } else {
    $('#title').html('Stats for: All videos');
  }
  getDataForVideo(videoId);
}

// Retrieve the next page of videos.
function nextPage() {
  requestVideoPlaylist(playlistId, nextPageToken);
}

// Retrieve the previous page of videos.
function previousPage() {
  requestVideoPlaylist(playlistId, prevPageToken);
}

function getDataForVideos() {
  getDataForVideo(videoId);
}

function getDataForVideo(id) {
  videoId = id;
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth() + 1;
  var d = now.getDate();
  var endDate = y + '-' + ( m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
  var startTime = new Date();
  startTime.setFullYear(now.getFullYear() - 1);
  y = startTime.getFullYear();
  m = startTime.getMonth() + 1;
  d = startTime.getDate();
  var startDate = y + '-' + ( m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);

  var metrics = $('#metrics').val();
  var requestOptions = {
    'ids': 'channel==' + channelId,
    'metrics': metrics,
    'dimensions': 'country',
    'start-date': startDate,
    'end-date': endDate
  };
  if (id) {
    requestOptions['filters'] = 'video==' + id;
  }
  var request = gapi.client.youtubeAnalytics.reports.query(requestOptions);
  request.execute(function(response) {
    drawGraph(response.result);
  });
}

function drawGraph(data) {
  $('#graph').html('');
  var width = 720,
    height = 720,
    outerRadius = Math.min(width, height) / 2 - 10,
    innerRadius = outerRadius - 24;

  var formatPercent = d3.format(".1%");

  var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  var layout = d3.layout.chord()
    .padding(.04)
    .sortSubgroups(d3.descending)
    .sortChords(d3.ascending);

  var path = d3.svg.chord()
    .radius(innerRadius);

  var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("id", "circle")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  svg.append("circle")
    .attr("r", outerRadius);

  var rows = data.rows;
  var headers = data.columnHeaders.slice(1);

  var numOfCountries = rows.length;
  var numOfMetrics = headers.length;

  var labels = [];
  var matrix = [];
  rows.forEach(function(row) {
    labels.push({
      'name': row[0],
      'color': '#'+Math.floor(Math.random()*16777215).toString(16)
    });
    var matrixRow = [];
    for(var i = 0; i < numOfCountries; i++) {
      matrixRow.push(0);
    }
    row.slice(1).forEach(function(val) {
      matrixRow.push(val);
    });
    matrix.push(matrixRow);
  });

  // Normalize
  if ($('#normalize').is(':checked')) {
    for (var i = 0; i < matrix[0].length; i++) { 
      var len = matrix.length;
      var sum = 0;
      for (var j = 0; j < len; j++) {
        sum += matrix[j][i];
      }
      if (sum) {
        for (var j = 0; j < len; j++) {
          matrix[j][i] = matrix[j][i] / sum;
        }
      }
    }
  }

  // Rotate and add.
  for (var i = 0; i < numOfMetrics; i++) {
    var nRow = [];
    for (var j = 0; j < numOfCountries; j++) {
      nRow.push(matrix[j][numOfCountries + i]);
    }
    for (var j = 0; j < numOfMetrics; j++) {
      nRow.push(0);
    }
    matrix.push(nRow);
  };

  headers.forEach(function(header) {
    labels.push({
      'name': header.name,
      'color': 'green'
    });
  });

  // Compute the chord layout.
  layout.matrix(matrix);

  // Add a group per neighborhood.
  var group = svg.selectAll(".group")
      .data(layout.groups)
      .enter().append("g")
      .attr("class", "group")
      .on("mouseover", mouseover);


  // Add a mouseover title.
  group.append("title").text(function(d, i) {
    return labels[i].name + ": " + formatPercent(d.value);
  });

  // Add the group arc.
  var groupPath = group.append("path")
      .attr("id", function(d, i) { return "group" + i; })
      .attr("d", arc)
      .style("fill", function(d, i) { return labels[i].color; });

  // Add a text label.
  var groupText = group.append("text")
      .attr("x", 6)
      .attr("dy", 15);

  groupText.append("textPath")
      .attr("xlink:href", function(d, i) { return "#group" + i; })
      .text(function(d, i) { return labels[i].name; });

  // Remove the labels that don't fit. :(
  groupText.filter(function(d, i) { return groupPath[0][i].getTotalLength() / 2 - 16 < this.getComputedTextLength(); })
      .remove();

  // Add the chords.
  var chord = svg.selectAll(".chord")
      .data(layout.chords)
      .enter().append("path")
      .attr("class", "chord")
      .style("fill", function(d) { return labels[d.source.index].color; })
      .attr("d", path);

  // Add an elaborate mouseover title for each chord.
  chord.append("title").text(function(d) {
    return labels[d.source.index].name + ': ' + d.source.value + ' ' + labels[d.target.index].name
  });

  function mouseover(d, i) {
    chord.classed("fade", function(p) {
      return p.source.index != i
          && p.target.index != i;
    });
  }

}
