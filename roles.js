let Tasks = require("tasks");

module.exports = {

	moveToDestination: function(creep) {
		if (creep.memory.room != null && creep.room.name != creep.memory.room) {
			creep.travelToRoom(creep.memory.room, true);
			return true;
		} else
			return false;
	},

	Scout: function(creep) {
		if (creep.memory.room != null) {
			if (creep.room.name != creep.memory.room) {
				creep.travelToRoom(creep.memory.room, true);
			} else {
				let controller = _.get(Game, ["rooms", creep.memory.room, "controller"]);
				if (controller != null && !creep.pos.inRangeTo(controller, 3))
					creep.travel(controller);
			}
		}
	},

    Worker: function(creep, isSafe) {
        let hostile = (isSafe == true)
			? _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, { filter:
				c => { return c.isHostile(); }}))
			: null;

		if (hostile == null) {
			if (creep.memory.state == "refueling") {
				if (_.sum(creep.carry) == creep.carryCapacity) {
					creep.memory.state = "working";
					Tasks.returnTask(creep);
					return;
				}

				Tasks.assignTask(creep, true);
				if (creep.runTaskTimer(creep)) {
					creep.runTask(creep);
				}
				return;

			} else if (creep.memory.state == "working") {
				if (creep.carry[RESOURCE_ENERGY] == 0) {
						creep.memory.state = "refueling";
						Tasks.returnTask(creep);
						return;
					}

				Tasks.assignTask(creep, false);
				if (creep.runTaskTimer(creep)) {
					creep.runTask(creep);
				}
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			}
		} else if (hostile != null) {			
			creep.moveFrom(creep, hostile);
			return;
		}
	},

    Mining: function(creep, isSafe) {
		let hostile = (isSafe == true)
			? _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, { filter:
				c => { return c.isHostile(); }}))
			: null;

		if (hostile == null) {
			if (creep.memory.state == "refueling") {
				if (creep.carryCapacity > 0 && _.sum(creep.carry) == creep.carryCapacity) {
					creep.memory.state = "delivering";
					Tasks.returnTask(creep);
					return;
				}

				Tasks.assignTask(creep, true);
				if (creep.runTaskTimer(creep)) {
					creep.runTask(creep);
				}
				return;

			} else if (creep.memory.state == "delivering") {
				if (creep.carryCapacity == 0 || _.sum(creep.carry) == 0) {
					creep.memory.state = "refueling";
					Tasks.returnTask(creep);
					return;
				}

				Tasks.assignTask(creep, false);
				if (creep.runTaskTimer(creep)) {
					creep.runTask(creep);
				}
				return;

			} else {
				creep.memory.state = "refueling";
				return;
			}
		} else if (hostile != null) {
			creep.moveFrom(creep, hostile);
			return;
		}
	},

    Courier: function(creep) {
		if (this.moveToDestination(creep))
			return;
		
		if (creep.memory.state == "loading") {
            if (_.sum(creep.carry) > 0) {
                creep.memory.state = "delivering";
                Tasks.returnTask(creep);
                return;
            }

            Tasks.assignTask(creep, true);
            if (creep.runTaskTimer(creep)) {
                creep.runTask(creep);
            }
            return;

        } else if (creep.memory.state == "delivering") {
            if (_.sum(creep.carry) == 0) {
                    creep.memory.state = "loading";
                    Tasks.returnTask(creep);
                    return;
                }

            Tasks.assignTask(creep, false);
            if (creep.runTaskTimer(creep)) {
                creep.runTask(creep);
            }
            return;

        } else {
            creep.memory.state = "loading";
            return;
		} 
	},

    Extracter: function(creep, isSafe) {
		let hostile = (isSafe == true)
			? _.head(creep.pos.findInRange(FIND_HOSTILE_CREEPS, 6, { filter:
				c => { return c.isHostile(); }}))
			: null;

		if (hostile == null) {
			switch (creep.memory.state) {
				default:
				case "get_minerals":
					if (_.sum(creep.carry) == creep.carryCapacity) {
						creep.memory.state = "deliver";
						Tasks.returnTask(creep);
						return;
					}

					Tasks.assignTask(creep, true);
					if (creep.runTaskTimer(creep)) {
						creep.runTask(creep);
					}
				return;

				case "deliver":
					if (_.sum(creep.carry) == 0) {
						creep.memory.state = "get_minerals";
						Tasks.returnTask(creep);
						return;
					}

					Tasks.assignTask(creep, false);
					if (creep.runTaskTimer(creep)) {
						creep.runTask(creep);
					}
				return;
			}
		} else if (hostile != null) {
			creep.moveFrom(creep, hostile);
			return;
		}
	},

    Reserver: function(creep) {
		if (this.moveToDestination(creep))
			return;

		let result = creep.reserveController(creep.room.controller);
		if (result == ERR_NOT_IN_RANGE) {
			creep.moveTo(creep.room.controller)
			return;
		} else if (result == ERR_NO_BODYPART) {
			return;		// Reservers and colonizers with no "claim" parts prevent null body spawn locking
		} else if (result == OK) {
			if (Game.time % 50 == 0) {
				let room_sign = _.get(Memory, ["hive", "signs", creep.room.name]);
				let default_sign = _.get(Memory, ["hive", "signs", "default"]);
				if (room_sign != null && _.get(creep, ["room", "controller", "sign", "text"]) != room_sign)
					creep.signController(creep.room.controller, room_sign);
				else if (room_sign == null && default_sign != null && _.get(creep, ["room", "controller", "sign", "text"]) != default_sign)
					creep.signController(creep.room.controller, default_sign);
			}
			if (Game.time % 10 == 0)
				creep.moveFromSource();
			return;
		}
	},

	Colonizer: function(creep) {
		if (this.moveToDestination(creep))
			return;

		let result = creep.claimController(creep.room.controller);
		if (result == ERR_NOT_IN_RANGE) {
			creep.moveTo(creep.room.controller)
			return;
		} else if (result == ERR_NO_BODYPART) {
			return;		// Reservers and colonizers with no "claim" parts prevent null body spawn locking
		} else {
			let request = _.get(Memory, ["sites", "colonization", creep.memory.room]);			
			if (_.get(request, ["target"]) == creep.room.name && creep.room.controller.my) {
				delete Memory["sites"]["colonization"][creep.room.name];
				_.set(Memory, ["rooms", creep.room.name, "spawn_assist", "rooms"], [_.get(request, ["from"])]);
				_.set(Memory, ["rooms", creep.room.name, "spawn_assist", "list_route"], _.get(request, ["list_route"]));
				_.set(Memory, ["rooms", creep.room.name, "layout"], _.get(request, "layout"));
				_.set(Memory, ["rooms", creep.room.name, "focus_defense"], _.get(request, "focus_defense"));
				_.set(Memory, ["hive", "pulses", "blueprint", "request"], creep.room.name);
				creep.suicide();
			} else if (result != OK) {
				console.log(`<font color=\"#F0FF00\">[Colonization]</font> ${creep.name} unable to colonize ${_.get(request, ["target"])}; error ${result}`);
			}
			return;
		}
	},

    Soldier: function(creep, targetStructures, targetCreeps, listTargets) {
		let _Combat = require("roles.combat");
		
		if (_Combat.acquireBoost(creep))
			return;
		if (_Combat.moveToDestination(creep, 10))
			return;
		
		_Combat.checkTarget_Existing(creep);
		_Combat.acquireTarget_ListTarget(creep, listTargets);
		
		if (targetCreeps)
			_Combat.acquireTarget_Creep(creep);		
		if (targetStructures) 
			_Combat.acquireTarget_Structure(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			let target = Game.getObjectById(creep.memory.target.id);

			creep.dismantle(target);
			creep.rangedAttack(target);
			let result = creep.attack(target);

			if (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true) {
				creep.moveTo(target, { reusePath: 0 });
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.heal(creep);

				if (_.get(creep, ["memory", "target", "rampart"]) != null) {
					let rampart = Game.getObjectById(creep.memory.target.rampart);
					if (rampart != null)
						creep.moveTo(rampart, { reusePath: 0 });
					else
						creep.moveTo(target, { reusePath: 0 });
				} else
					creep.moveTo(target, { reusePath: 0 });
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
				return;
			}
		} else {
			creep.heal(creep);
			_Combat.setCamp(creep);
			_Combat.moveToCamp(creep);					
			return;
		}
	},

	Archer: function(creep, targetStructures, targetCreeps, listTargets) {
		let _Combat = require("roles.combat");
		
		if (_Combat.acquireBoost(creep))
			return;
		if (_Combat.moveToDestination(creep, 10))
			return;

		_Combat.checkTarget_Existing(creep);
		_Combat.acquireTarget_ListTarget(creep, listTargets);
		
		if (targetCreeps)
			_Combat.acquireTarget_Creep(creep);		
		if (targetStructures) 
			_Combat.acquireTarget_Structure(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			let target = Game.getObjectById(creep.memory.target.id);
						
			creep.attack(target);
			creep.dismantle(target);
			let result = creep.rangedAttack(target);

			if (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true) {
				creep.moveTo(target, { reusePath: 0 });
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.heal(creep);

				if (_.get(creep, ["memory", "target", "rampart"]) != null) {
					let rampart = Game.getObjectById(creep.memory.target.rampart);
					if (rampart != null)
						creep.moveTo(rampart, { reusePath: 0 });
					else
						creep.moveTo(target, { reusePath: 0 });
				} else
					creep.moveTo(target, { reusePath: 0 });
				return;
			} else if (result == OK && creep.pos.getRangeTo(target < 3)) {
				creep.moveFrom(creep, target);
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
				return;
			}
		} else {
			creep.heal(creep);
			_Combat.setCamp(creep);
			_Combat.moveToCamp(creep);
			return;
		}
	},

	Dismantler: function(creep, targetStructures, listTargets) {
		let _Combat = require("roles.combat");
		
		if (_Combat.acquireBoost(creep))
			return;
		if (_Combat.moveToDestination(creep, 10))
			return;
		
		_Combat.checkTarget_Existing(creep);
		_Combat.acquireTarget_ListTarget(creep, listTargets);
		
		if (targetStructures) 
			_Combat.acquireTarget_Structure(creep);

		if (_.get(creep, ["memory", "target", "id"]) != null) {
			let target = Game.getObjectById(creep.memory.target.id);

			creep.rangedAttack(target);
			creep.attack(target);
			let result = creep.dismantle(target);

			if (result == ERR_INVALID_TARGET && target instanceof ConstructionSite == true) {
				creep.moveTo(target, { reusePath: 0 });
			} else if (result == ERR_NOT_IN_RANGE) {
				creep.heal(creep);
				creep.moveTo(target, { reusePath: 0 });
				return;
			} else if (result == OK) {
				return;
			} else {
				creep.heal(creep);
				return;
			}
		} else {
			creep.heal(creep);
			return;
		}
	},

    Healer: function(creep, to_partner) {
		let _Combat = require("roles.combat");

		if (_Combat.acquireBoost(creep))
			return;
		if (_Combat.moveToDestination(creep, 10))
			return;

		let wounded = creep.pos.findClosestByRange(FIND_MY_CREEPS, { filter:
			c => { return c.hits < c.hitsMax; }});
		if (wounded != null && creep.heal(wounded) == ERR_NOT_IN_RANGE) {
			creep.rangedHeal(wounded);
			creep.moveTo(wounded);
			return;
		}

		if (creep.hits < creep.hitsMax)
			creep.heal(creep)

		if (to_partner) {
			if (_.get(creep, ["memory", "partner"]) == null) {
				let p = _.head(_.sortBy(_.filter(creep.pos.findInRange(FIND_MY_CREEPS, 5, { filter: c => { return c.memory.role != "healer" }}),
					c => c.memory.healer != null),
					c => c.pos.getRangeTo(creep)));

				creep.memory.partner = _.get(p, "id", null);
				_.set(p, ["memory", "healer"], creep.id);
			} else {
				let p = Game.getObjectById(_.get(creep, ["memory", "partner"]));
				if (p == null)
					_.set(creep, ["memory", "partner"], null);
				else if (creep.pos.getRangeTo(p) > 1)
					creep.moveTo(p, { reusePath: 0 });
			}
		}
		
		if (_.get(creep, ["memory", "partner"]) == null) {			
			_Combat.setCamp(creep);
			_Combat.moveToCamp(creep);
		}
	},
};