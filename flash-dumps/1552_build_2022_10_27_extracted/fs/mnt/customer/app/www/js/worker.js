importScripts("renderer.js");

var renderer = null;
var decoder = null;
var waitKeyFrame = true;


function init(canvas) {
  if (renderer == null) {
    renderer = new TSLRenderer('webgl2', canvas);
    if (decoder) decoder.close();
    decoder = new VideoDecoder({
      output(frame) {
        renderer.render(frame);
      },
      error(e) {
        console.log(e);
      }
    });
    decoder.configure({
      codec: "avc1.64001f"
    });
  }
}

function decode(data) {
  if (waitKeyFrame) {
    if (data[4] != 39 && data[4] != 103) {
      self.postMessage('sps');
      return;
    }
    self.postMessage('key');
    waitKeyFrame = false;
  }
  decoder.decode(new EncodedVideoChunk({
    type: 'key',
    data,
    timestamp: 0,
  }));
}

self.addEventListener("message", event => {
  const data = event.data;
  switch (data.id) {
    case "init": {
      init(data.canvas);
      waitKeyFrame = true;
      break;
    }
    case "decode": {
      decode(data.data);
      break;
    }
    case "clear": {
      if (renderer) {
        renderer.clear();
        waitKeyFrame = true;
      }
      break
    }
  }
}, {once: false});
