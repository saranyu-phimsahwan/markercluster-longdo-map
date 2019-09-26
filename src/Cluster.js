import {ClusterIcon} from './Icon';
import {LLBBox} from './LLBBox';
const longdo = window.longdo;
/**
 * class for cluster
 * @export Cluster
 * @class Cluster
 */
export default class{
    /**
     * Creates an isntance of Cluster
     * @param {MarkerCluster} markerCluster MarkerCluster instance
     * @param {ConfigHandler} config config variables
     * @param {IconLoader} iloader IconLoader instance
     */
    constructor(markerCluster,config,iloader){
        this._markerCluster = markerCluster;
        this._config = config;
        this._map = markerCluster._map;
        
        this._center = null;
        this._markers = [];
        this._bounds = null;
        this._clusterIcon = new ClusterIcon(this,this._config,iloader);
    }

    /**
     * add marker to the cluster
     * @param {longdo.Marker} marker marker to be added
     * @param {longdo.Tile} [tile] tile including marker(optional), needed only in swarm mode 1.
     * @returns {undefined}
     */
    addMarker(marker,tile){
        if(!this._center){
            this._center = marker.location();
            this._calculateBounds();
        }else{
            if(this._config.averageCenter){
                this._center = longdo.Util.averageLocation(longdo.Projections.EPSG3857,
                    this._center,marker.location());
                this._calculateBounds();
            }
        }
        marker.isAdded = true;
        this._markers.push(marker);

        if(this._config.drawMarkerArea){
            this._bounds.drawArea(this._map);
        }

        if(this._config.swarmModeEnabled && this._config.swarmAlg === 1){
            //TODO
            if(!this._gridids){
                this._gridids = [];
            }
            this._gridids.push(LLBBox.generateFrom(
                longdo.Util.boundOfTile(longdo.Projections.EPSG3857,tile)
            ).getNxNGridCord(marker.location(),4));

            
            if(!this._markersToShow){
                this._markersToShow = [marker];
            }else if(this._markersToShow.length <= 64){
                let markersInSameGrid = 0;
                const that = this;
                this._gridids.forEach(function(value){
                    const gridid = that._gridids[that._gridids.length-1];
                    markersInSameGrid += gridid.u === value.u && gridid.v === value.v ? 1 : 0;
                });

                if(markersInSameGrid % 8 !== 0){
                    return true;
                }
                this._markersToShow.push(marker);
            }else{
                return true;
            }
            if(!marker.active()){
                this._map.Overlays.add(marker);
            }
            return true;
        }else if(this._config.swarmModeEnabled && this._config.swarmAlg === 2){
            if(this._markers.length < 11 || this._markers.length % 10 === 0){
                if(!marker.active()){
                    this._map.Overlays.add(marker);
                }
            }
            return true;
        }
        return true;
    }
    /**
     * remove icon & itself
     * @returns {undefined}
     */
    remove(){
        this._clusterIcon.remove();
        this._markers.length = 0;
        delete this._markers;
        this._bounds.removeArea(this._map);
    }

    /**
     * calculate cluster bound
     * @returns {undefined}
     */
    _calculateBounds(){
        this._bounds = LLBBox.generateRect(this._center).extendSize(this._config.gridSize*Math.pow(2,-this._map.zoom()));     
    }

    /**
     * returns whether marker is inside cluster bounds
     * @param {longdo.Marker} marker marker to be checked
     * @returns {boolean} If marker is inside cluster bound, returns true
     */
    isMarkerInClusterBounds(marker){
        return this._bounds.isLocInBounds(marker.location());
    }
    /**
     * update icon's style and position and then show on map
     * @returns {undefined}
     */
    finalize(){
        this._clusterIcon.setSums(this._markers.length);
        this._clusterIcon.setCenter(this._center);
        this._clusterIcon.show();
    }
}