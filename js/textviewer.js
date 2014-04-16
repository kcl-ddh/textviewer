/**
 */
function TextViewer(lowerBoundary) {
    var self = this;

    this.panels = [];
    this.locationId = '';
    this.maxHeight = $(lowerBoundary).offset().top;

    $(window).bind('resize', function() {
        self.onResize();
    });
    $(window).bind('scroll', function() {
        self.onResize();
    });
    this.switches = { };
}

/**
 * Adds a new TextPanel to the TextViewer.
 * @param contentUrl Base URL to get content.
 * @param textSelect Select element that defines the content.
 * @param box Element to display the text.
 * @param syncSelector Name of the element used to sync the different panels.
 */
TextViewer.prototype.addPanel = function(contentUrl, textSelect, box,
                                         syncSelector) {
    this.panels.push(new TextPanel(this, this.panels.length, contentUrl,
                                   textSelect, box, syncSelector));
};

/**
 * Returns the TextViewer maximum height.
 */
TextViewer.prototype.getMaxHeight = function() {
    return this.maxHeight;
};

TextViewer.prototype.getSwitch = function(name) {
    return this.switches[name];
};

TextViewer.prototype.setSwitch = function(name, value) {
    this.switches[name] = value;
};

/**
 * Handle resize events.
 */
TextViewer.prototype.onResize = function() {
    for (panel in this.panels) {
        this.panels[panel].onResize();
    }
};

TextViewer.prototype.synchronisePanels = function(referencePanel) {
    if (!this.getSwitch('sync')) {
        return;
    }

    this.highlight(this.locationId, false, false);
    this.locationId = referencePanel.getLocationId();
    this.highlight(this.locationId, true, true);

    for (i in this.panels) {
        var panel = this.panels[i];
        if (panel != referencePanel) {
            panel.syncToLocationId(this.locationId);
        }
    }
};

TextViewer.prototype.highlight = function(locationId, active, bothPanes) {
    if (!this.getSwitch('highlight')) {
        return;
    }

    var elements = $('*[data-text-id = ' + locationId + ']');

    if (!bothPanes || elements.length > 1) {
        $.each(elements, function(i, element) {
            var obj = $(element);

            if (obj.children().length < 1) {
                obj = obj.parent();
            }

            if (active) {
                obj.addClass('highlight');
            } else {
                obj.removeClass('highlight');
            }
        });
    }
};

/**
 * Updates the location.
 */
TextViewer.prototype.updateLocation = function() {
    var hash = '';
    for (panel in this.panels) {
        if (panel > 0) {
            hash += '/';
        }
        hash += this.panels[panel].getLocation();
    }
    location.hash = hash;
};


/**
 */
function TextPanel(viewer, position, contentUrl, textSelect, box, syncSelector) {
    var self = this;

    this.viewer = viewer;
    this.position = position;
    this.contentUrl = contentUrl;
    this.textSelect = textSelect;
    this.box = box;
    this.beingSynced = false;
    this.locationId = '';
    this.textSelect.change(function() {
        self.onTextSelectChange();
    });
    this.bindOnScroll(true);
    this.onResize();
    this.onTextSelectChange();
}

/**
 * Bind scroll event.
 */
TextPanel.prototype.bindOnScroll = function(bind) {
    var self = this;

    if (this.onScroll == null) {
        this.onScroll = function(event) {
            self.onVisibleContentChange($(event.target));
        };
    }

    if (bind) {
        this.box.bind('scroll', this.onScroll);
    } else {
        this.box.unbind('scroll', this.onScroll);
    }
};

TextPanel.prototype.getFirstVisibleElement = function(selector, windowHeight) {
        // get_first_visible_element($('.viewer-text-box'), 'p')
        var ret = null;
        if (windowHeight == null) {
            windowHeight = 40;
        }
        var windowTop = this.box.offset().top;
        var windowBottom = windowTop + windowHeight;
        var elements = this.box.find(selector).each(function() {
            var top = $(this).offset().top;
            if (top <= windowBottom) {
                ret = $(this);
            }
            return (top < windowTop);
        });
        return ret;
};

/**
 * Returns the panel location.
 */
TextPanel.prototype.getLocation = function() {
    return this.textSelect.val();
};

/**
 * Returns the ID of the current place in the text.
 */
TextPanel.prototype.getLocationId = function() {
    return this.locationId;
};

/**
 * Loads the text at textUrl into this panel.
 * @param textUrl URL fragment referencing the text to load
 */
TextPanel.prototype.loadSection = function(textUrl) {
    this.box.html('<div class="spinner"> </div>');

    $.ajax({
        url: self.contentUrl + textUrl + '/',
        async: false,
        dataType: 'html',
        type: 'GET',
        success: function(data, textStatus, xhr) {
            data = data.trim();
            var toc = $(data).filter('#text-toc');
            var content = $(data).filter('#text-content');
            var toolBar = self.box.parent().find('.panel-tool-bar');
            toolBar.find('#text-toc').remove();
            toolBar.append(toc);
            self.box.html(content);
        }
    });

    this.viewer.updateLocation();
};

/**
 * Handle resize events.
 */
TextPanel.prototype.onResize = function() {
    var boxTop = this.box.offset().top;
    var margin = 20;
    var minHeight = 100;
    var maxHeight = this.viewer.getMaxHeight() - boxTop - margin;
    var height = $(window).height() - $('html').scrollTop() - boxTop - margin;

    height = height > maxHeight ? maxHeight : height;
    height = height < minHeight ? minHeight : height;
    height = parseInt(height) + 'px';

    this.box.css('height', height);
    this.onVisibleContentChange();
};

/**
 * Handle type changes, loads new content into the panel according to the type.
 */
TextPanel.prototype.onTextSelectChange = function() {
    var self = this;
    var textUrl = this.getLocation();
    if (textUrl && textUrl.length > 0) {
        this.loadSection(textUrl);
    } else {
        this.box.html('');
        this.viewer.updateLocation();
    }
};

/**
 * Handle changes to the box content.
 */
TextPanel.prototype.onVisibleContentChange = function() {
    var element = this.getFirstVisibleElement('*[data-text-id]');
    this.locationId = element ? element.attr('data-text-id') : '';
    if (!this.beingSynced) {
        this.viewer.synchronisePanels(this);
    }
    this.beingSynced = false;
};

TextPanel.prototype.scrollBoxToElement = function(element) {
    var ret = false;
    if (element.offset()) {
        var before = this.box.scrollTop();
        this.box.scrollTop(element.offset().top - this.box.offset().top +
                           before);
        if (this.box.scrollTop() == before) {
            this.beingSynced = false;
        }
        ret = true;
    }
    return ret;
};

TextPanel.prototype.setLocationId = function(locationId) {
    var element = this.box.find('*[data-text-id=' + locationId + ']').first();
    return this.scrollBoxToElement(element);
};

TextPanel.prototype.syncToLocationId = function(locationId) {
    this.beingSynced = true;
    return this.setLocationId(locationId);
};
