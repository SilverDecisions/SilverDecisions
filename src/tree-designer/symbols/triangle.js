var sqrt3 = Math.sqrt(3);

export default {
    draw: function(context, size) {
        var r = Math.sqrt(size / Math.PI);
        context.moveTo(-r, 0);
        context.lineTo(0.9*r, -r);
        context.lineTo(0.9*r, r);
        context.closePath();
    }
};
