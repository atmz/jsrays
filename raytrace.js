function Material(ka, kd, ks, ds, ri, rf)
{
	this.ka=ka;
	this.kd=kd;
	this.ks=ks;
	this.ds=ds;
	this.ri=1;
	this.rf=0;
	if(ri!=undefined)
		this.ri=ri;
	if(rf!=undefined)
		this.rf=rf;
}

function Point(x,y,z){
	this.x = x;
	this.y = y;
	this.z = z;
}
Point.prototype.toString=function(){ 
	return '['+ this.x + "," + this.y+"," + this.z+']';
} 
Point.prototype.subtract=function(that){ 
	return new Point(this.x-that.x, this.y-that.y, this.z-that.z);
} 
Point.prototype.add=function(that){ 
	return new Point(this.x+that.x, this.y+that.y, this.z+that.z);
} 
Point.prototype.scale=function(f){ 
	return new Point(this.x*f, this.y*f, this.z*f);
} 
Point.prototype.dot=function(that)
{
	return this.x * that.x + this.y*that.y + this.z*that.z;
}
Point.prototype.normalize=function()
{
	var len = this.length();
	return new Point(this.x/len, this.y/len, this.z/len);
}
Point.prototype.length=function()
{
	return  Math.sqrt(this.x * this.x + this.y*this.y + this.z * this.z);
}

function Plane(position, normal, color, material){
	this.position = position;
	this.normalValue = normal.normalize(); 
	this.color = color;
	this.material=material; 
} 
Plane.prototype.normal=function(intersection){ 
	return this.normalValue;
} 
Plane.prototype.intersect=function(origin, ray){ 
	// d = ((position - origin) . n)  /   (ray . n) 
	var numerator = this.normalValue.dot(this.position.subtract(origin));
	var denominator = this.normalValue.dot(ray);
	if(denominator == 0) return Infinity;
	var d = numerator/denominator;
	if(d<0) return Infinity;
	return d;
} 
Plane.prototype.toString=function(){ 
	return '[Plane interesecting with:'+this.position+' and with normal:'+ this.normal+']';
} 


function Sphere(position, radius, color, material){
	this.position = position;
	this.radius = radius; 
	this.color = function(point){return color;}; 
	this.material=material; 
} 
Sphere.prototype.normal=function(intersection){ 
	return intersection.subtract(this.position).normalize();
	//return this.position.subtract(intersection).normalize();
} 
Sphere.prototype.intersect=function(origin, ray){ 
	// d = (-(ray . (origin-position)) +- squrt((ray.(origin-position))^2 - ray^2((origin-position-c)^2)-radius^2))
	/*
	var op = origin.subtract(this.position);
	var rayop = ray.dot(op);
//	console.log("op: " + op);
//	console.log("ray: " + ray);
//	console.log("rayop: " + rayop);
	if(rayop>0) return Infinity; //if sphere not entirely in front of camera we don't want it
	var sqrt = rayop*rayop - ray.dot(ray) * (op.dot(op)-this.radius*this.radius);
//	console.log("sqrt: " + sqrt);
	if(sqrt<0) return Infinity; //no intersection
	sqrt = Math.sqrt(sqrt);
	//if(sqrt>rayop) return Infinity; //we are in the sphere, no intersection
	return  rayop - sqrt; //return smallest solution; i.e. closest positive d*/
	var newOrigin = origin.subtract(this.position);
	//'a' is 1 as ray is normalized
	var b = 2 * newOrigin.dot(ray);
	var c = newOrigin.dot(newOrigin) - this.radius*this.radius;
	var sqrt = b*b - 4*c;
	if(sqrt<0) return Infinity;
	sqrt = Math.sqrt(sqrt);
	if((-b - sqrt)/2 < 0)
	{
		//return Infinity; // don't hit internal surfaces
		return (-b + sqrt)/2;
	}
	else
	{
		return (-b - sqrt)/2;
	}
	
} 
Sphere.prototype.toString=function(){ 
	return '[Sphere with origin:'+this.position+' and with radius:'+ this.radius+']';
} 
function Color(r,g,b)
{
	this.r=r;
	this.g=g;
	this.b=b;
	this.a=255;
}

Color.prototype.add=function(that){ 
	return new Color(this.r+that.r, this.g+that.g, this.b+that.b);
} 

Color.prototype.scale=function(f){ 
	var temp = this.sanitize();
	return new Color(temp.r*f, temp.g*f, temp.b*f).sanitize();
} 


Color.prototype.cross=function(that){ 
	return new Color(this.r*that.r, this.g*that.g, this.b*that.b);
} 

Color.prototype.mix=function(that){ 
	return new Color(Math.min(this.r,that.r), Math.min(this.g,that.g), Math.min(this.b,that.b));
} 

Color.prototype.sanitize=function(){ 
	return new Color(Math.min(255,this.r), Math.min(255,this.g), Math.min(255,this.b));
} 


Color.prototype.toString=function(){ 
	return '['+ this.r + "," + this.g+"," + this.b+']';
} 

function noFalloffIntensity(intensity)
{
	return function(distance)
	{
		return intensity;
	};
}

function logFalloffIntensity(intensity)
{
	return function(distance)
	{
		return intensity/(Math.log(distance));
	};
}

function linearFalloffIntensity(intensity)
{
	return function(distance)
	{
		return intensity/distance;
	};
}

function Light(position, color, intensity)
{
	this.position = position;
	this.color = color;
	this.intensity = intensity;
}

function Scene(cameraPosition, cameraDirection)
{
	this.cameraPosition = cameraPosition;
	this.cameraDirection = cameraDirection.normalize();
	this.lights = new Array();
	this.objects=new Array();
}

Scene.prototype.addObject=function(object)
{
	this.objects.push(object);
}

Scene.prototype.addLight=function(light)
{
	this.lights.push(light);
}

Scene.prototype.toString=function()
{
	var s = "[Camera position:"+this.cameraPosition+ ", facing " +this.cameraDirection+
	"\nLight: " + this.light +"\nObjects: [";
	for(i in this.objects)
	{
		s = s + "\n" + this.objects[i];
	}
	return s + "]]";
}


function Pixel(x,y,color){
	this.x = x;
	this.y = y;
	this.color = color;
}

function setPixel(imageData, pixel) {
	pixel.y = imageData.height - pixel.y; //flip up/down
    var index = (pixel.x + pixel.y * imageData.width) * 4;
    imageData.data[index+0] = pixel.color.r;
    imageData.data[index+1] = pixel.color.g;
    imageData.data[index+2] = pixel.color.b;
    imageData.data[index+3] = pixel.color.a;
}

function reflect(ri, ray, normal)
{
	var r = ri;
	var c = - ray.dot(normal)
	if(c<0) //in this case we are leaving the object
	{
		r = 1/ri;
		c = - ray.dot(normal.scale(-1));
	}
	var newRay = ray.add(normal.scale(2*c));
	return newRay.normalize();
}
function refract(ri, ray, normal)
{
	var r = 1/ri;
	var c = - ray.dot(normal)
	if(c<0) //in this case we are leaving the object
	{
		r = 1/ri;
		c = - ray.dot(normal.scale(-1));
	}
	if(1 - r*r*(1-c*c) < 0) return undefined;
	var ncoeff = Math.abs(r*c) - Math.sqrt(1 - r*r*(1-c*c));/*
	console.log(1 - r*r*(1-c*c));
	console.log(Math.sqrt(1 - r*r*(1-c*c)));
	console.log(r*c);*/
	var newRay = ray.scale(r).add(normal.scale(ncoeff));
	return newRay.normalize();
}


function castRay(origin, ray, scene)
{
	var e = 1e-10;
	var minD = Infinity;
	var closest = undefined;
	for(i in scene.objects)
	{
		var d = scene.objects[i].intersect(origin, ray);
		if(d<minD && d>e) { 
			minD = d;
			closest = scene.objects[i]; 
		}
	}
	var color = new Color(0,0,0);
	if(minD<Infinity && closest != undefined)
	{    
		//console.log(closest);
		var point = ray.scale(minD).add(origin);
		var material = closest.material;
		var normal = closest.normal(point);
		//ambient
		if(normal.dot(ray)<0)
		{
			color = closest.color(point).scale(material.ka);
		}
		
		for(l in scene.lights)
		{
			var light = scene.lights[l];
			var toL = light.position.subtract(point);
			var toLn = toL.normalize()
			//check if shadowed
			var minD = toL.length();
			var shadowed = false;
			for(i in scene.objects)
			{
				if(i!=closest)
				{
					var d = scene.objects[i].intersect(point, toLn);
					if(d<minD && d>e) { 
						minD = d;
						shadowed = true;
						break;
					}
				}
			}
			if(!shadowed)
			{
				var intensity = light.intensity(toL.length());
				/*
				console.log("minD: "+minD);
				console.log("ray: "+ray);
				console.log("point: "+point);
				console.log("normal: "+ normal);*/
				if(normal.dot(ray)<0) //don't get any color from internal surface (for now)
				{
					//diffuse
					var diffuse = material.kd * Math.max(normal.dot(toLn), 0) * intensity;
					//this does cool weird stuffcolor = color.add(closest.color(point).scale(diffuse).cross(light.color));
					color = color.add(closest.color(point).mix(light.color).scale(diffuse));
					//color = color.add(diffuse);
					//color = color.add(diffuse).scale(50000/(toL.dot(toL)));
		
					//specular
					//Ks * (N dot ( L + V / 2))^n
					var n=material.ds;
					var spec = material.ks * Math.pow(toLn.subtract(ray).scale(0.5).dot(normal), n) * intensity;
					color = color.add(light.color.scale(spec));
				}
			}
		}
	}
	if(closest!=undefined && closest.material.rf>0 )
	{
		color=color.scale(1-closest.material.rf);
		var nextRay=refract(closest.material.ri, ray, normal);
		if(nextRay==undefined) //total reflection
		{
			 nextRay=reflect(closest.material.ri, ray, normal);
		}
		var nextOrigin=point.add(nextRay.scale(e)); //adding e to ray to prevent hitting the same spot due to floats
		var nextColor = castRay(nextOrigin, nextRay, scene);
		color=color.add(nextColor.scale(closest.material.rf));

	}
	return color;
}


function rayTrace(scene, imageData)
{
	var width = imageData.width;
	var height = imageData.height;
	var ratio = height/width;
	var fovx = .4	
	fovx = Math.tan(fovx);
	var fovy = fovx * ratio;	
	for(var u = 0; u < width; u++)
	{
		var x = fovx * (2*u - width) / width;
		for(var v = 0; v < height; v++)
		{
			var y = fovy * (2*v - height) / height;
			var ray = (new Point(x,y,0)).add(scene.cameraDirection).normalize();
			var color = castRay(scene.cameraPosition, ray, scene);
			var pixel = new Pixel(u,v,color);
			setPixel(imageData,pixel);
		}
	}
	
	
	
}


