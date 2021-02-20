import {
  WebGLRenderer,
  Scene,
  Color,
  PerspectiveCamera,
  AmbientLight,
  PointLight,
  TorusGeometry,
  CanvasTexture,
  MeshPhongMaterial,
  Mesh,
  RepeatWrapping,
} from "https://unpkg.com/three@0.125.1/build/three.module.js";
import { WEBGL } from "https://unpkg.com/three@0.125.1/examples/jsm/WebGL.js";
import { TrackballControls } from "https://unpkg.com/three@0.125.1/examples/jsm/controls/TrackballControls.js";

if (!WEBGL.isWebGLAvailable()) alert(WEBGL.getWebGLErrorMessage());

let renderer = undefined;
let scene = undefined;
let camera = undefined;
let controls = undefined;
let container = undefined;
let borus = undefined;
let left_pressed = 0;
let right_pressed = 0;
let up_pressed = 0;
let down_pressed = 0;
const background_image = new Image();
background_image.src = "./Wood048_1K_Color.jpg";

function init(container_) {
  container = container_;

  // renderer
  renderer = new WebGLRenderer({
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xffffff, 1.0);
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  container.appendChild(renderer.domElement);

  // scene
  scene = new Scene();
  scene.background = new Color(0xffffff);

  // camera
  const fov = 45.0;
  const aspect = container.offsetWidth / container.offsetHeight;
  const near = 0.01;
  const far = 1000;
  const eyeZ = 50;
  camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = eyeZ;

  // lights
  const ambient = new AmbientLight(0xffffff, 0.35);
  camera.add(ambient);
  const point = new PointLight(0xffffff);
  point.position.set(2, 20, 15);
  camera.add(point);

  scene.add(camera);

  // controls
  controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 5.0;

  // events
  window.addEventListener("resize", () => {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.offsetWidth, container.offsetHeight);
    controls.handleResize();
    render();
  });

  // Torus mesh
  const geo = new TorusGeometry(10, 7, 16, 100);

  // Texture
  const tex = new CanvasTexture(document.getElementById("toggle-texture"));
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  const mat = new MeshPhongMaterial({
    map: tex,
  });
  borus = new Mesh(geo, mat);
  console.log(borus.geometry)
  scene.add(borus);
}

function render() {
  // set viewport and render mesh
  let width = container.offsetWidth;

  renderer.setViewport(0.0, 0.0, width, container.offsetHeight);
  renderer.setScissor(0.0, 0.0, width, container.offsetHeight);
  renderer.setScissorTest(true);
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();

  const uv = borus.geometry.attributes.uv.array;
  const num_points = uv.length / 2;
  const scrolling_horizontal = right_pressed - left_pressed;
  const scrolling_vertical = up_pressed - down_pressed;
  for (let i = 0; i < num_points; i ++) {
    uv[2 * i] += scrolling_horizontal * 0.005;
    uv[2 * i + 1] += scrolling_vertical * 0.005;
  }
  borus.geometry.attributes.uv.needsUpdate = (scrolling_horizontal != 0 || scrolling_vertical != 0)

  render();
}

function drawOnCanvas(num_columns, num_rows, board_letters) {
  const canvas = document.getElementById("toggle-texture");
  const ctx = canvas.getContext("2d");
  ctx.canvas.width = canvas.offsetWidth;
  ctx.canvas.height = canvas.offsetHeight;
  ctx.fillStyle = "#eef";
  
  // ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  ctx.drawImage(background_image, 0, 0, canvas.offsetWidth, canvas.offsetHeight);

  ctx.beginPath();
  ctx.lineWidth = 3;

  const col_w = canvas.offsetWidth / num_columns;
  const row_h = canvas.offsetHeight / num_rows;
  for (let i = 0; i < num_columns + 1; i++) {
    ctx.moveTo(i * col_w, 0);
    ctx.lineTo(i * col_w, canvas.offsetHeight);
  }
  for (let i = 0; i < num_rows + 1; i++) {
    ctx.moveTo(0, i * row_h);
    ctx.lineTo(canvas.offsetWidth, i * row_h);
  }
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let counter = 0;
  for (let i = 0; i < num_rows; i ++) {
    for (let j = 0; j < num_columns; j++) {
      let letter = board_letters[counter].toUpperCase();
      ctx.font = "50px Carrois Gothic";
      if ("Q" == letter) {
        letter = "Qu";
        ctx.font = "35px Carrois Gothic";
      }
      ctx.fillText(letter, (j + 0.5) * col_w, (i + 0.5) * row_h);
      if ("MWNZ".includes(letter)) {
        ctx.moveTo((j + 0.25) * col_w, (i + 0.8) * row_h);
        ctx.lineTo((j + 0.75) * col_w, (i + 0.8) * row_h);
      }
      counter ++;
    }
  }
  ctx.stroke();

  // ctx.arc(canvas.offsetWidth / 2, canvas.offsetHeight / 2, canvas.offsetHeight / 2 - 20, 0, 2 * Math.PI);
}


let board_letters = '';
while (board_letters.length < 100) {
  board_letters += Math.random().toString(36).replace(/[^a-z]+/g, '');
}

background_image.addEventListener('load', function() {
  drawOnCanvas(10,10, board_letters);
  // console.log(document.getElementById("three-view"));
  init(document.getElementById("three-view"));
  animate();
}, false);

window.addEventListener('keydown', e => {
  switch (e.key) {
    case "ArrowLeft":
      left_pressed = 1;
      break;
    case "ArrowRight":
      right_pressed = 1;
      break;
    case "ArrowUp":
      up_pressed = 1;
      break;
    case "ArrowDown":
      down_pressed = 1;
      break;
  }
});

window.addEventListener('keyup', e => {
  switch (e.key) {
    case "ArrowLeft":
      left_pressed = 0;
      break;
    case "ArrowRight":
      right_pressed = 0;
      break;
    case "ArrowUp":
      up_pressed = 0;
      break;
    case "ArrowDown":
      down_pressed = 0;
      break;
  }
});
