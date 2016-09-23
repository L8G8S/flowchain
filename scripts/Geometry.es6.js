'use strict';

class Point {
    /**
     * Create a new Point
     * @param  {Number} x The x-axis value
     * @param  {Number} y The y-axis value
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    clone(){
        return new Point(this.x, this.y);
    }

    isEmpty(){
        return (this.x === 0 && this.y === 0);
    }

    equals(p) {
        return p ? this.x === p.x && this.y === p.y : false;
    }
    
    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        return this;
    }
    
    /**
     * Move the point by the specified offset.
     * @param  {Vector} v Translation vector
     */
    translate(v){
        //Object.assign(this, Geometry.translate(this, v));
        this.x += v.x;
        this.y += v.y;

        return this;
    }

    /**
     * Rotate the point by a specified angle around another point.
     * @param  {Number} a The angle value
     * @param  {Point} o The origin
     */
    rotate(a, o){
        Geometry.rotate(this, a, (o || new Point()), true);

        return this;
    }

    /**
     * Calculate the dot product with the given point.
     * @param  {Point} a The first point
     * @return {Number} The value of the dot product
     */
    dot(p){
        return Geometry.dot(this, p);
    }

    /**
     * Calculate the cross product with the given point.
     * @param  {Point} a The first point
     * @return {Number} The value of the cross product
     */
    cross(p){
        return Geometry.cross(this, p);
    }

    /**
     * Calculate the distance to the given point.
     * @param  {Point} p the point from which we want the distance
     * @return {Number} The value of the distance
     */
    distance(p){
        return Geometry.distance(this, p);
    }
    
    add(p) {
        this.x += p.x;
        this.y += p.y;
    }
    
    substract(p){
        this.x -= p.x;
        this.y -= p.y;
    }
}

class Vector {
    constructor(x = 0, y = 0){
        this.x = x;
        this.y = y;
    }

    isEmpty() {
        return (this.x === 0 && this.y === 0);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class Size {
    /**
     * Create a new Size
     * @param  {Number} w The width value
     * @param  {Number} h The height value
     */
    constructor(w = 0, h = 0) {
        this.width = w;
        this.height = h;
    }

    isEmpty(){
        return (this.width === 0 && this.height === 0);
    }
    
    clone(){
        return new Size(this.width, this.height);
    }
    
    equals(s) {
        return s ? this.width === s.width && this.height === s.height : false;
    }
}

class Line {
    /**
     * Create a new Line
     * @param  {Point} p1 First point of the Line
     * @param  {Point} p2 Second point of the Line
     */
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    clone(){
        return new Line(this.p1.clone(), this.p2.clone());
    }
    
    equals(l) {
        return l ? (this.p1.equals(l.p1) && this.p2.equals(l.p2)) : false;
    }
    
    /**
     * Gets the center point.
     * @return {Point} the center point
     */
    get center(){
        return new Point(this.p1.x + (this.p2.x - this.p1.x)/2, this.p1.y + (this.p2.y - this.p1.y)/2);
    }
    
    get length() {
        return Geometry.distance(this.p1, this.p2);    
    }
    
    get vector() {
        return new Vector(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
    }
    
    get angle() {
        return Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x) * 180 / Math.PI;    
    }
    
    /**
     * Move the Line by the specified offset.
     * @param  {Vector} v Translation vector
     */
    translate(v){
        this.p1.translate(v);
        this.p2.translate(v);

        return this;
    }
}

class Triangle {
    /**
     * Create a new Triangle
     * @param  {Point} p1 First point of the triangle
     * @param  {Point} p2 Second point of the triangle
     * @param  {Point} p3 Third point of the triangle
     */
    constructor(p1, p2, p3) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    clone(){
        return new Triangle(this.p1.clone(), this.p2.clone(), this.p3.clone());
    }
    
    equals(t) {
        return t ? (this.p1.equals(t.p1) && this.p2.equals(t.p2) && this.p3.equals(t.p3)) : false;
    }
    
    round() {
        this.p1.round();
        this.p2.round();
        this.p3.round();

        return this;
    }
    
    /**
     * Gets the center point.
     * @return {Point} the center point
     */
    get center(){
        let l1 = new Line(new Point((this.p1.x + this.p2.x) / 2, (this.p1.y + this.p2.y) / 2), this.p3);
        let l2 = new Line(new Point((this.p2.x + this.p3.x) / 2, (this.p2.y + this.p3.y) / 2), this.p1);

        return Geometry.getIntersectionLineLine(l1, l2);
    }

    /**
     * Move the Triangle by the specified offset.
     * @param  {Vector} v Translation vector
     */
    translate(v){
        this.p1.translate(v);
        this.p2.translate(v);
        this.p3.translate(v);

        return this;
    }

    /**
     * Rotate the Triangle by a specified angle around another point.
     * @param  {Number} a The angle value
     * @param  {Point} o The origin
     */
    rotate(a, o){
        this.p1.rotate(a, o);
        this.p2.rotate(a, o);
        this.p3.rotate(a, o);

        return this;
    }

    toPolygon(){
        return [
            new Line(new Point(this.p1.x, this.p1.y), new Point(this.p2.x, this.p2.y)),
            new Line(new Point(this.p2.x, this.p2.y), new Point(this.p3.x, this.p3.y)),
            new Line(new Point(this.p3.x, this.p3.y), new Point(this.p1.x, this.p1.y))
        ];
    }
}

class Rectangle {
    
    static from(value) {
        if(value instanceof ClientRect) {
            return new Rectangle(new Point(value.left, value.top), new Size(value.width, value.height));
        }
        
        return null;
    }
    
    /**
     * Create a new Rectangle
     * @param  {Point} location The location
     * @param  {Size} size The size
     */
    constructor(location = new Point(), size = new Size()) {
        this.location = location;
        this.size = size;
    }

    /**
     * Gets the x-axis value.
     * @return {Number} the value
     */
    get x(){
        return this.location.x;
    }

    /**
     * Set the x-axis value.
     * @param  {Number} the new value
     */
    set x(value){
        this.location.x = value;
    }

    /**
     * Gets the y-axis value.
     * @return {Number} the value
     */
    get y(){
        return this.location.y;
    }

    /**
     * Set the y-axis value.
     * @param  {Number} the new value
     */
    set y(value){
        this.location.y = value;
    }

    /**
     * Gets the width value.
     * @return {Number} the value
     */
    get width(){
        return this.size.width;
    }

    /**
     * Set the width value.
     * @param  {Number} the new value
     */
    set width(value){
        this.size.width = value;
    }

    /**
     * Gets the height value.
     * @return {Number} the value
     */
    get height(){
        return this.size.height;
    }

    /**
     * Set the height value.
     * @param  {Number} the new value
     */
    set height(value){
        this.size.height = value;
    }

    /**
     * Gets the center point.
     * @return {Point} the center point
     */
    get center(){
        return new Point(this.x + this.width/2, this.y + this.height/2);
    }

    // WARN: all the follwing methods are valid only if the rectangle is not rotated at all

    contains(p){
        return (p.x > this.x && p.x < (this.x + this.width) && p.y > this.y && p.y < (this.y + this.height));
    }

   
    inflate(dx,dy){
        this.translate(new Vector(-dx, -dy));
        this.size.width += dx + dx;
        this.size.height += dy + dy;

        return this;
    }

    /**
     * Move the rectangle by the specified offset.
     * @param  {Vector} v Translation vector
     */
    translate(v){
        this.location.translate(v);

        return this;
    }

    /**
     * Rotate the rectangle by a specified angle around another point.
     * @param  {Number} a The angle value
     * @param  {Point} o The origin
     */
    rotate(a, o){
        this.location.rotate(a, o);

        return this;
    }

    toPolygon(){
        return [
            new Line(new Point(this.x, this.y),                             new Point(this.x + this.width, this.y)),
            new Line(new Point(this.x + this.width, this.y),                new Point(this.x + this.width, this.y + this.height)),
            new Line(new Point(this.x + this.width, this.y + this.height),  new Point(this.x, this.y + this.height)),
            new Line(new Point(this.x, this.y + this.height),               new Point(this.x, this.y))
        ];
    }
}

class Geometry {
    
    static pointAtDistance(p, dist, angle){
        return new Point(Math.cos(angle * Math.PI/180) * dist + p.x, Math.sin(angle * Math.PI/180) * dist + p.y);
    }
    
    /**
     * Calculate the dot product of two points.
     * @param  {Point} a The first point
     * @param  {Point} b The second point
     * @return {Number} The value of the dot product
     */
    static dot(a, b){
        return a.x * b.x + a.y * b.y;
    }

    /**
     * Calculate the cross product of two points.
     * @param  {Point} a The first point
     * @param  {Point} b The second point
     * @return {Number} The value of the cross product
     */
    static cross(a, b) {
        return a.x * b.y - a.y * b.x;
    }

    static angle(v1, v2){
        if(v1 === undefined || v2 === undefined) return 0;

        if(v1.x === 0 && v2.y === 0){
            return 90 * (v1.y < 0 ? -1 : 1);
        }
        else{
            return (v1.y<0 ? -1 : 1) * Math.acos( (v1.x * v2.x + v1.y * v2.y) / ( Math.sqrt(v1.x*v1.x + v1.y*v1.y) * Math.sqrt(v2.x*v2.x + v2.y*v2.y) ) ) * 180 / Math.PI;
        }
    }

    /**
     * Translate the given point by a specified vector.
     * @param  {Point} p The point to translate
     * @param  {Vector} v The translation vector
     * @return {Point} The translated point
     */
    static translate(p, v) {
        return new Point(p.x + v.x, p.y + v.y);
    }

    /**
     * Rotate the given point by a specified angle around another point.
     * @param  {Point} p The point to rotate
     * @param  {Number} a The angle value
     * @param  {Point} o The origin
     * @return {Point} The rotated point
     */
    static rotate(p, a, o, override = false) {
        let dx = p.x - o.x,
            dy = p.y - o.y,
            rang = (a * (Math.PI / 180)) +  Math.atan2(dy, dx),
            dist = Math.sqrt(dx * dx + dy * dy);
        
        if(override === true) {
            p.x = Math.cos(rang) * dist + o.x;
            p.y = Math.sin(rang) * dist + o.y;
            
            return p;
        }
        else {
            return new Point(Math.cos(rang) * dist + o.x, Math.sin(rang) * dist + o.y);   
        }
    }

    /**
     * Calculate the distance between two points.
     * @param  {Point} p1 The first point
     * @param  {Point} p2 The second point
     * @return {Number} The value of the distance
     */
    static distance(p1, p2){
        var dx = p1.x - p2.x;
        var dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Checks if a Point is on a line segment
     * @param  {Line} segment The line segment
     * @param  {Point} point   The point
     * @return {Boolean} Return <code>true</code> if point is on line,
     *                          <code>false</code> otherwise.
     */
    static isPointOnLine(segment, point) {
        // Move the segment so that the point is over at 0,0
        var segmentPointA = new Point(0, 0);
        var segmentPointB = new Point(segment.p2.x - segment.p1.x, segment.p2.y - segment.p1.y);
        var a = new Line(segmentPointA, segmentPointB);
        var b = new Point(point.x - segment.p1.x, point.y - segment.p1.y);

        // Perform the cross product
        var r = Geometry.crossProduct(a.p1, b);

        // Return the result. If the number is between 0 and EPSILON then the point
        // can be considered to be on the line.
        return Math.abs(r) < Number.EPSILON;
    }

    /**
     * Checks if two Lines intersect.
     * @param  {Line} l1 The first line
     * @param  {Line} l2 The second line
     * @return {Boolean} Return <code>true</code> if there is an intersection,
     *                          <code>false</code> otherwise.
     */
    static isLineIntersectLine(l1, l2){
        return Geometry.getIntersectionLineLine(l1, l2) !== null;
    }

    /**
     * Gets the intersection point between two lines.
     * @param  {Line} l1 The first line
     * @param  {Line} l2 The second line
     * @return {Point} Return a point if there is an intersection, <code>null</code> otherwise.
     */
    static getIntersectionLineLine(l1, l2){
        let a1 = l1.p1,
            a2 = l1.p2,
            b1 = l2.p1,
            b2 = l2.p2;

        let ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
        let ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
        let u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

        if (u_b != 0) {
            let ua = ua_t / u_b;
            let ub = ub_t / u_b;
            if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
                return new Point(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y));
            }
        }
        /*
        else {
            if (ua_t == 0 || ub_t == 0) {
                // Coincident
            } else {
                // Parallel
            }
        }
        */

        return null;
    }

    /**
     * Checks if a line intersects with a polygon.
     * @param  {Line} l The first line
     * @param  {Array} poly The polygon, ie. an array of lines defining the polygon
     * @return {Boolean} Return <code>true</code> if there is an intersection,
     *                          <code>false</code> otherwise.
     */
    static isLineIntersectPolygon(l, poly){
        let it = Geometry.getIntersectionLinePolygon(l, poly);
        return it.next().value !== undefined;
    }

    /**
     * Gets intersections between a line and a polygon.
     * @param  {Line} l The first line
     * @param  {Array} poly The polygon, ie. an array of lines defining the polygon
     * @return {Array} Return all intersections, <code>null</code> otherwise.
     */
    static *getIntersectionLinePolygon(l, poly){
        for(let s of poly){
            let i = Geometry.getIntersectionLineLine(l, s);
            if(i !== null){
                yield i;
            }
        }
    }
    
    /**
     * Checks if a line intersects with a circle.
     * @param  {Line} l The line
     * @param  {Point} The center of the circle
     * @param  {Number} The radius of the circle
     * @return {Number} Return all intersections, <code>null</code> otherwise.
     */
    static isLineIntersectCircle(l, c, r){
        let it = Geometry.getIntersectionLineCircle(l, c, r);
        return it.next().value !== undefined;
    }
    
    /**
     * Gets intersections between a line and a circle.
     * @param  {Line} l The line
     * @param  {Point} The center of the circle
     * @param  {Number} The radius of the circle
     * @return {Array} Return all intersections, empty array otherwise.
     */
    static getIntersectionLineCircle(l, c, r) {
        let a1 = l.p1,
            a2 = l.p2;
            
        let a = (a2.x - a1.x) * (a2.x - a1.x) + (a2.y - a1.y) * (a2.y - a1.y);
        let b = 2 * ((a2.x - a1.x) * (a1.x - c.x) + (a2.y - a1.y) * (a1.y - c.y));
        let cc = c.x * c.x + c.y * c.y + a1.x * a1.x + a1.y * a1.y - 2 * (c.x * a1.x + c.y * a1.y) - r * r;
        let deter = b * b - 4 * a * cc;
        let points = [];
           
        /*
        if (deter < 0) {
            // outside
        } else if (deter == 0) {
           // tangent
        } else {
        */
        if(deter > 0) {
            var e = Math.sqrt(deter);
            var u1 = (-b + e) / (2 * a);
            var u2 = (-b - e) / (2 * a);
            if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
                /*
                if ((u1 < 0 && u2 < 0) || (u1 > 1 && u2 > 1)) {
                    // outside
                } else {
                    // inside
                }
                */
            } 
            else {
                if (0 <= u1 && u1 <= 1)
                    points.push(new Point(a1.x + (a2.x - a1.x) * u1, a1.y + (a2.y - a1.y) * u1));
                
                if (0 <= u2 && u2 <= 1)
                    points.push(new Point(a1.x + (a2.x - a1.x) * u2, a1.y + (a2.y - a1.y) * u2));
            }
        }

        return points;
    }
}