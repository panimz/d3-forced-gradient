// https://www.davrous.com/2013/06/21/tutorial-part-4-learning-how-to-write-a-3d-software-engine-in-c-ts-or-js-rasterization-z-buffering/

window.CushyCode = window.CushyCode || {};

(function () {

    //utils 

    function clamp(value, min, max) {
        if (!min) { min = 0; }
        if (!max) { max = 1; }
        return Math.max(min, Math.min(value, max));
    };

    function interpolate(min, max, gradient) {
        return min + (max - min) * clamp(gradient);
    };

    function dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    function diff(a, b) {
        return {
            x: a.x - b.x,
            y: a.y - b.y
        };
    }

    function barycentric(point, a, b, c) {

        var v0 = diff(c, a);
        var v1 = diff(b, a);
        var v2 = diff(point, a);

        var dot00 = dot(v0, v0);
        var dot01 = dot(v0, v1);
        var dot02 = dot(v0, v2);
        var dot11 = dot(v1, v1);
        var dot12 = dot(v1, v2);

        var denom = (dot00 * dot11 - dot01 * dot01);

        // collinear or singular triangle
        if (denom === 0) {
            return { u: -2, v: -1, w: -1, isOutside: true };
        }

        var invDenom = 1 / denom;
        var w = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;
        var u = 1 - w - v;

        // barycentric coordinates must always sum to 1
        return {
            u: u,
            v: v,
            w: w,
            isOutside: (u < 0 || v < 0 || w < 0)
        };
    };

    var gradientMeshRenderer = function (canvas)
    {
        this.currentCanvas = canvas;
        this.buffer = null; //canvas imageData
    }   

    gradientMeshRenderer.prototype.render = function (mesh) {
        var ctx = this.currentCanvas.getContext("2d");
        var width = this.currentCanvas.width;
        var height = this.currentCanvas.height;
        this.buffer = ctx.createImageData(width, height);
        for (var i = 0; i < mesh.length; i++) {
            this.drawTriangle(mesh[i]);
        }
        var b = this.buffer;
        ctx.putImageData(b, 0, 0);
    };

    gradientMeshRenderer.prototype.drawTriangle = function (triangle) {
        // Sorting the points in order to always have this order on screen p1, p2 & p3
        // with p1 always up (thus having the Y the lowest possible to be near the top screen)
        // then p2 between p1 & p3
        triangle.sort((a, b) => { return a.y - b.y; });
        var p1 = triangle[0],
            p2 = triangle[1],
            p3 = triangle[2];

        // inverse slopes
        var dP1P2 = (p2.y - p1.y > 0) ? (p2.x - p1.x) / (p2.y - p1.y) : 0;
        var dP1P3 = (p3.y - p1.y > 0) ? (p3.x - p1.x) / (p3.y - p1.y) : 0;

        if (dP1P2 > dP1P3) {
            for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (y < p2.y) {
                    this.processScanLine(y, p1, p3, p1, p2, triangle);
                } else {
                    this.processScanLine(y, p1, p3, p2, p3, triangle);
                }
            }
        }
        else {
            for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (y < p2.y) {
                    this.processScanLine(y, p1, p2, p1, p3, triangle);
                } else {
                    this.processScanLine(y, p2, p3, p1, p3, triangle);
                }
            }
        }
    };


    // drawing line between 2 points from left to right
    // papb -> pcpd
    // pa, pb, pc, pd must then be sorted before
    gradientMeshRenderer.prototype.processScanLine = function (y, pa, pb, pc, pd, triangle) {
        var gradient1 = (pa.y !== pb.y) ? (y - pa.y) / (pb.y - pa.y) : 1;
        var gradient2 = (pc.y !== pd.y) ? (y - pc.y) / (pd.y - pc.y) : 1;

        var sx = interpolate(pa.x, pb.x, gradient1) >> 0;
        var ex = interpolate(pc.x, pd.x, gradient2) >> 0;

        for (var x = sx; x < ex; x++) {
            var point = { x: x, y: y };
            this.putPixel(point, triangle);
        }
    };

    gradientMeshRenderer.prototype.putPixel = function (point, triangle) {
        var coords = barycentric(point, triangle[0], triangle[1], triangle[2]);
        if (coords.isOutside) {
            return;
        }
        var index = (point.x + point.y * this.buffer.width) * 4;
        var colorA = triangle[0].color;
        var colorB = triangle[1].color;
        var colorC = triangle[2].color;
        for (var i = 0; i < 4; i++) {
            var color = colorA[i] * coords.u +
                colorB[i] * coords.v +
                colorC[i] * coords.w;
            this.buffer.data[index + i] = color;
        }
    };

    window.CushyCode.GradientMeshRenderer = gradientMeshRenderer;

})(window.CushyCode);
