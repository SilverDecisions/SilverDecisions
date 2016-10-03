import * as d3 from './d3'

/*based on:
 * github.com/patorjk/d3-context-menu */

export class ContextMenu {
    openCallback;
    closeCallback;

    constructor(menu, opts) {
        var self = this;

        if (typeof opts === 'function') {
            self.openCallback = opts;
        } else {
            opts = opts || {};
            self.openCallback = opts.onOpen;
            self.closeCallback = opts.onClose;
        }

        // create the div element that will hold the context menu
        d3.selectAll('.d3-context-menu').data([1])
            .enter()
            .append('div')
            .attr('class', 'd3-context-menu');

        // close menu
        d3.select('body').on('click.d3-context-menu', function () {
            d3.select('.d3-context-menu').style('display', 'none');
            if (self.closeCallback) {
                self.closeCallback();
            }
        });

        // this gets executed when a contextmenu event occurs
        return function (data, index) {
            var elm = this;

            d3.selectAll('.d3-context-menu').html('');
            var list = d3.selectAll('.d3-context-menu')
                .on('contextmenu', function (d) {
                    d3.select('.d3-context-menu').style('display', 'none');
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                })
                .append('ul');
            list.selectAll('li').data(typeof menu === 'function' ? menu(data) : menu).enter()
                .append('li')
                .attr('class', function (d) {
                    var ret = '';
                    if (d.divider) {
                        ret += ' is-divider';
                    }
                    if (d.disabled) {
                        ret += ' is-disabled';
                    }
                    if (!d.action) {
                        ret += ' is-header';
                    }
                    return ret;
                })
                .html(function (d) {
                    if (d.divider) {
                        return '<hr>';
                    }
                    if (!d.title) {
                        console.error('No title attribute set. Check the spelling of your options.');
                    }
                    return (typeof d.title === 'string') ? d.title : d.title(data);
                })
                .on('click', function (d, i) {
                    if (d.disabled) return; // do nothing if disabled
                    if (!d.action) return; // headers have no "action"
                    d.action(elm, data, index);
                    d3.select('.d3-context-menu').style('display', 'none');

                    if (self.closeCallback) {
                        self.closeCallback();
                    }
                });

            // the openCallback allows an action to fire before the menu is displayed
            // an example usage would be closing a tooltip
            if (self.openCallback) {
                if (self.openCallback(data, index) === false) {
                    return;
                }
            }

            // display context menu
            d3.select('.d3-context-menu')
                .style('left', (d3.event.pageX - 2) + 'px')
                .style('top', (d3.event.pageY - 2) + 'px')
                .style('display', 'block');

            d3.event.preventDefault();
            d3.event.stopPropagation();
        };
    };

    static hide() {
        d3.select('.d3-context-menu').style('display', 'none');
    }

}
