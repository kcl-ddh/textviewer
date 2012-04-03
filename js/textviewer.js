/**
 */
function TextViewer(lowerBoundary) {
    var self = this;

    this.panels = [];
    this.maxHeight = $(lowerBoundary).offset().top;

    $(window).bind('resize', function() {
        self.onResize(); 
    });
    $(window).bind('scroll', function() {
        self.onResize();
    });
}

/**
 * Handle resize events.
 */
TextViewer.prototype.onResize = function() {
    for (panel in this.panels) {
        this.panels[panel].onResize();
    }
}

/**
 * Adds a new TextPanel to the TextViewer.
 * @param contentUrl Base URL to get content.
 * @param type Select element that defines the type of content.
 * @param box Element to display the text.
 */
TextViewer.prototype.addPanel = function(contentUrl, type, box) {
    this.panels.push(new TextPanel(this, this.panels.length, contentUrl, type, 
                box));
}

/**
 * Returns the TextViewer maximum height.
 */
TextViewer.prototype.getMaxHeight = function() {
    return this.maxHeight;
}


/**
 */
function TextPanel(viewer, position, contentUrl, type, box) {
    var self = this;

    this.viewer = viewer;
    this.position = position;
    this.contentUrl = contentUrl;
    this.type = type;
    this.box = box;

    this.type.change(function() {
        self.onTypeChange();
    });

    this.bindOnScroll();
    this.onResize();
    this.onTypeChange();
}

/**
 * TODO: This needs more functionality.
 * Handle type changes, loads new content into the panel according to the type.
 */
TextPanel.prototype.onTypeChange = function() {
    var self = this;

    var data = $.ajax({
        url: self.contentUrl + self.type.val() + '.content',
        async: false,
        type: 'GET',
    });

    this.box.html(data.responseText);
}

/**
 * TODO: Implement.
 * Bind scroll event.
 */
TextPanel.prototype.bindOnScroll = function(bind) {
    var self = this;
}

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
    this.onVisibleContentChange()
}

/**
 * TODO: Implement.
 * Handle changes to the box content.
 */
TextPanel.prototype.onVisibleContentChange = function() {
    
}
