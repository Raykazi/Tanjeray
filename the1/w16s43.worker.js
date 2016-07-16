var w16s43Worker = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // Manage machine states!
        if (creep.memory.state == 'working' && creep.carry[RESOURCE_ENERGY] == 0 && creep.memory.role != 'w16s43defender') {
            creep.memory.state = 'getenergy';
        }
        else if (creep.memory.state == 'getenergy' && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            creep.memory.state = 'working';
        }
        else if (creep.memory.state != 'getenergy' && creep.memory.state != 'working') {
            creep.memory.state = 'working';
        }

        // Out of energy? Find more...
	    if(creep.memory.state == 'getenergy') {
            var source;
            
            // Try to pick up off the ground first, if there is a pile...
            source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
            
            if (source != null && source.amount > 100)  {
                
                if (creep.pickup(source) == ERR_NOT_IN_RANGE)
                    creep.moveTo(source);
            }
            
            else // Try to pull energy from storage containers...
            {
                source = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0)
                                        || (structure.structureType == STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 0);
                            }
                    });
                
                if (source != null) {
                    if (source.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                }
                else { // But if there are none... then harvest from a source
                    
                    source = creep.pos.findClosestByPath(FIND_SOURCES);
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    } 
                }
            }
	    }
	    
	    
	    
	    // Upgrader
	    else if (creep.memory.state == 'working' && creep.memory.role == 'w16s43upgrader') {
	    // Have energy? Upgrade something!!!
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
	    }
	    
	    // Repairer
	    else if (creep.memory.state == 'working' && creep.memory.role == 'w16s43repairer') {
	    // Have energy? Repair something!!!
            var structure;
                // Find critical structures first
                structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    	                        filter: function(structure) {
    	                            return (structure.structureType == STRUCTURE_RAMPART && structure.hits < 20000)
                                        || (structure.structureType == STRUCTURE_WALL && structure.hits < 10000)
                                        || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 3)
                                        || (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 3);
    	                        } 
    	                });
                // Then find structures to maintain
                if (structure == null) {
                    structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        	                        filter: function(structure) {
        	                            return (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax / 2)
        	                                || (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax / 2)
                                            || (structure.structureType == STRUCTURE_RAMPART && structure.hits < 100000)
                                            || (structure.structureType == STRUCTURE_WALL && structure.hits < 100000);
        	                        } 
        	                });
                } 
                if(creep.repair(structure) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
	    }
	    
	    // Defender
	    else if (creep.memory.state == 'working' && creep.memory.role == 'w16s43defender') {
	    // Is there something to attack??
            var targets = creep.room.find(FIND_HOSTILE_CREEPS);
            if (targets.length > 0) {
                if(creep.attack(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            }
	    }
	    
	    // Builder
	    else if (creep.memory.state == 'working' && creep.memory.role == 'w16s43builder') {
	    // Have energy? Build something!!!
	        var target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            if(creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            if(target == null) {
                creep.moveTo(Game.spawns.Spawn2);
            }
	    }
	}
};

module.exports = w16s43Worker;