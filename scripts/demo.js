(function () {

    var width = 500,
            height = 500,
            τ = 2 * Math.PI,
            maxLength = 100,
            sqrMaxLength = maxLength * maxLength;

    var colors = [
        [144, 12, 62, 255], // #900C3E
        [255, 87, 51, 255], // #FF5733
        [255, 195, 0, 255] // #FFC300
    ];

    var total = 50;
    var nodes = d3.range(total).map(function (d) {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            color: colors[d % colors.length]
        };
    });

    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes.slice())
        .charge(function (d, i) { return i ? -100 : -500; })
        .on("tick", ticked)
        .start();

    var voronoi = d3.geom.voronoi()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; });

    var root = nodes.shift();
    root.fixed = true;

    var canvas = d3.select("#placeholder").append("canvas")
        .attr("width", width)
        .attr("height", height)
        .on("ontouchstart" in document ? "touchmove" : "mousemove", moved);

    var meshRenderer = new window.CushyCode.GradientMeshRenderer(canvas.node());

    function moved() {
        var p1 = d3.mouse(this);
        root.px = p1[0];
        root.py = p1[1];
        force.resume();
    }

    function ticked() {
        var triangles = voronoi.triangles(nodes);
        meshRenderer.render(triangles);
    }

})();