import { useEffect } from "react";

type RainProps = {
  mouseObject?: "Umbrella" | "Cup" | "Circle";
  auto?: boolean;
};

export function Rain({ mouseObject, auto }: RainProps) {
  useEffect(() => {
    // Source: https://codepen.io/sheepjs/pen/nXZKLy
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    var width = 0;
    var height = 0;

    function onresize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    onresize();

    window.onresize = onresize;

    var mouse = {
      X: 0,
      Y: 0,
    };

    window.onmousemove = function onmousemove(event) {
      mouse.X = event.clientX;
      mouse.Y = event.clientY;
    };

    const particles: any[] = [];
    const drops: any[] = [];
    var numberBase = 5;
    var numberB = 2;

    var controls = {
      rain: 2,
      Object: mouseObject,
      alpha: 1,
      color: 200,
      auto,
      opacity: 1,
      saturation: 100,
      lightness: 50,
      back: 100,
      red: 45,
      green: 55,
      blue: 72,
      multi: false,
      speed: 3,
    };

    function Rain(X: any, Y: any, number?: any) {
      if (!number) {
        number = numberB;
      }
      while (number--) {
        particles.push({
          vitesseX: Math.random() * 0.25,
          vitesseY: Math.random() * 9 + 1,
          X: X,
          Y: Y,
          alpha: 1,
          color:
            "hsla(" +
            controls.color +
            "," +
            controls.saturation +
            "%, " +
            controls.lightness +
            "%," +
            controls.opacity +
            ")",
        });
      }
    }

    function explosion(X: any, Y: any, color: any, nombre?: any) {
      if (!nombre) {
        nombre = numberBase;
      }
      while (nombre--) {
        drops.push({
          vitesseX: Math.random() * 4 - 2,
          vitesseY: Math.random() * -4,
          X: X,
          Y: Y,
          radius: 0.65 + Math.floor(Math.random() * 1.6),
          alpha: 1,
          color: color,
        });
      }
    }

    function render(ctx: any) {
      if (controls.multi == true) {
        controls.color = Math.random() * 360;
      }

      ctx.save();
      ctx.fillStyle =
        "rgba(" +
        controls.red +
        "," +
        controls.green +
        "," +
        controls.blue +
        "," +
        controls.alpha +
        ")";
      ctx.fillRect(0, 0, width, height);

      var particuleslocales = particles;
      var goutteslocales = drops;
      var tau = Math.PI * 2;

      for (
        var i = 0, particulesactives;
        (particulesactives = particuleslocales[i]);
        i++
      ) {
        ctx.globalAlpha = particulesactives.alpha;
        ctx.fillStyle = particulesactives.color;
        ctx.fillRect(
          particulesactives.X,
          particulesactives.Y,
          particulesactives.vitesseY / 4,
          particulesactives.vitesseY,
        );
      }

      for (
        var i = 0, gouttesactives;
        (gouttesactives = goutteslocales[i]);
        i++
      ) {
        ctx.globalAlpha = gouttesactives.alpha;
        ctx.fillStyle = gouttesactives.color;

        ctx.beginPath();
        ctx.arc(
          gouttesactives.X,
          gouttesactives.Y,
          gouttesactives.radius,
          0,
          tau,
        );
        ctx.fill();
      }
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;

      if (controls.Object == "Umbrella") {
        ctx.beginPath();
        ctx.arc(mouse.X, mouse.Y + 10, 138, 1 * Math.PI, 2 * Math.PI, false);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "hsla(0,100%,100%,1)";
        ctx.stroke();
      }
      if (controls.Object == "Cup") {
        ctx.beginPath();
        ctx.arc(mouse.X, mouse.Y + 10, 143, 1 * Math.PI, 2 * Math.PI, true);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "hsla(0,100%,100%,1)";
        ctx.stroke();
      }
      if (controls.Object == "Circle") {
        ctx.beginPath();
        ctx.arc(mouse.X, mouse.Y + 10, 138, 1 * Math.PI, 3 * Math.PI, false);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "hsla(0,100%,100%,1)";
        ctx.stroke();
      }
      ctx.restore();

      if (controls.auto) {
        controls.color += controls.speed;
        if (controls.color >= 360) {
          controls.color = 0;
        }
      }
    }

    function update() {
      var particuleslocales = particles;
      var goutteslocales = drops;

      for (
        var i = 0, particulesactives;
        (particulesactives = particuleslocales[i]);
        i++
      ) {
        particulesactives.X += particulesactives.vitesseX;
        particulesactives.Y += particulesactives.vitesseY + 5;
        if (particulesactives.Y > height - 15) {
          particuleslocales.splice(i--, 1);
          explosion(
            particulesactives.X,
            particulesactives.Y,
            particulesactives.color,
          );
        }
        var umbrella =
          (particulesactives.X - mouse.X) * (particulesactives.X - mouse.X) +
          (particulesactives.Y - mouse.Y) * (particulesactives.Y - mouse.Y);
        if (controls.Object == "Umbrella") {
          if (
            umbrella < 20000 &&
            umbrella > 10000 &&
            particulesactives.Y < mouse.Y
          ) {
            explosion(
              particulesactives.X,
              particulesactives.Y,
              particulesactives.color,
            );
            particuleslocales.splice(i--, 1);
          }
        }
        if (controls.Object == "Cup") {
          if (
            umbrella > 20000 &&
            umbrella < 30000 &&
            particulesactives.X + 138 > mouse.X &&
            particulesactives.X - 138 < mouse.X &&
            particulesactives.Y > mouse.Y
          ) {
            explosion(
              particulesactives.X,
              particulesactives.Y,
              particulesactives.color,
            );
            particuleslocales.splice(i--, 1);
          }
        }
        if (controls.Object == "Circle") {
          if (umbrella < 20000) {
            explosion(
              particulesactives.X,
              particulesactives.Y,
              particulesactives.color,
            );
            particuleslocales.splice(i--, 1);
          }
        }
      }

      for (
        var i = 0, gouttesactives;
        (gouttesactives = goutteslocales[i]);
        i++
      ) {
        gouttesactives.X += gouttesactives.vitesseX;
        gouttesactives.Y += gouttesactives.vitesseY;
        gouttesactives.radius -= 0.075;
        if (gouttesactives.alpha > 0) {
          gouttesactives.alpha -= 0.005;
        } else {
          gouttesactives.alpha = 0;
        }
        if (gouttesactives.radius < 0) {
          goutteslocales.splice(i--, 1);
        }
      }

      var i = controls.rain;
      while (i--) {
        Rain(Math.floor(Math.random() * width), -15);
      }
    }

    (function boucle() {
      requestAnimationFrame(boucle);
      update();
      render(ctx);
    })();
  }, [auto, mouseObject]);

  return (
    <canvas
      id="canvas"
      style={{ position: "absolute", top: "0px", left: "0px", zIndex: -1 }}
    />
  );
}
