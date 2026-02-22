import Tree from './Tree.js';

/**
 * Base class for deciduous trees (broad-leaved trees that shed leaves).
 */
export default class Deciduous extends Tree {
    constructor(options = {}) {
        super(options);
        // Default properties for deciduous trees
        this.options.isEvergreen = false;
        
        // Example feature: deciduous trees can lose leaves, maybe based on a season later
        this.options.hasLeaves = options.hasLeaves !== undefined ? options.hasLeaves : true;
    }
}
