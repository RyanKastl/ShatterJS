function convertToTriangles(verts) {
    var TriList = [];
    for (var i = 0; i < verts.length; i+=9) {
        var newTri = {
            vertices: []
        };
        for (var j = 0; (j < 9) && (i+j < verts.length); j+=3) {
            newTri.vertices.push([verts[i+j], verts[i+j+1], verts[i+j+2]]);
        }
        TriList.push(newTri);
    }
    return TriList;
}

function vertexDistance(x, y) {
	return (Math.sqrt(Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2)));
}

function findMid(x, y) {
	var mid = [];

	for (var i = 0; i < x.length; i++) {
		mid.push((x[i] + y[i]) / 2);
	}
	return mid;
}

function getVertex(list, n) {
	var index = n*3;

	return [list[index], list[index+1], list[index+2]];
}

function equalize(src, dest) {
    var small = {};
    var large = {};

    if (src.length < dest.length) {
        small = src;
        large = dest;
    }
    else {
        small = dest;
        large = src;
    }

    var smlTri = convertToTriangles(small);
    var lrgTri = convertToTriangles(large);

    //var newTriList = [];

    if (1.0 * lrgTri.length / smlTri.length > 2) {
        var exp = Math.log(lrgTri) / Math.log(smlTri.length);
        console.log("Exponent: " + exp);
        for (var i = 0; i < smlTri.length; i++) {
            breakTriangle(smlTri.shift(), Math.floor(exp), smlTri);
        }
    }

    var remainder = lrgTri.length - newTriList;

    for (var i = 0; i < remainder; i++) {
        breakTriangle(smlTri.shift(), 1, smlTri);
    }

    console.log("Length of sml: " + smlTri.length);
    console.log("Length of lrg: " + lrgTri.length);
}

function breakTriangle(triangle, n, list) {
    if (n == 0) {
        list.push(triangle);
        return;
    }

    var v1 = triangle.vertices[0];
    var v2 = triangle.vertices[1];
    var v3 = triangle.vertices[2];

    var verts = [v1, v2, v3];

    var maxDistance = 0;
    var vertex1 = [0,0,0];
    var vertex2 = [0,0,0];
    var vertexEnd = [0,0,0];

    for (var i = 0; i < verts.length; i++) {
    	var distance = vertexDistance(verts[i], verts[(i+1) % verts.length]);
    	if (distance > maxDistance) {
    		maxDistance = distance;
    		vertex1 = verts[i];
    		vertex2 = verts[(i+1) % verts.length];
    		vertexEnd = verts[(i+2) % verts.length];
    	}
    }

    var vertexStart = findMid(vertex1, vertex2);

    var newVerts1 = [vertex1, vertexStart, vertexEnd];
    var newVerts2 = [vertex2, vertexStart, vertexEnd];

    var newTriangle1 = {vertices: newVerts1};
    var newTriangle2 = {vertices: newVerts2};

    breakTriangle(newTriangle1, n - 1, list);
    breakTriangle(newTriangle2, n - 1, list);
}