
class Assignment{
    constructor (
        public id: number, // unique key, 
        public resourceId: number, // ???
        public roleId: number, // ???
        public effort: any //  ???
    ) {}  
}

class Link {
    constructor (
        public from: Task, 
        public to: Task, 
        public lag: number // lagInWorkingDays
    ) {}  
}

export class Utils {
    // translate to next working day
    static computeStart(start: number) {
        return Utils.computeStartDate(start).getTime();
    }

    static computeStartDate(start: number) {
        var d = new Date(start+3600000*12);
        d.setHours(0, 0, 0, 0);
        //move to next working day
        while (Utils.isHoliday(d)) {
            d.setDate(d.getDate() + 1);
        } 
        d.setHours(0, 0, 0, 0);
        return d;
    }

    static computeEnd(end: number) {
        return Utils.computeEndDate(end).getTime()
    }

    static computeEndDate(end: number) {
        var d = new Date(end-3600000*12);
        d.setHours(23, 59, 59, 999);
        //move to next working day
        while (Utils.isHoliday(d)) {
        d.setDate(d.getDate() + 1);
        }
        d.setHours(23, 59, 59, 999);
        return d;
    }

    static incrementDateByWorkingDays(from: number, days: number) {
        let date = new Date(from)
        let q = Math.abs(days);
        while (q > 0) {
            date.setDate(date.getDate() + (days > 0 ? 1 : -1));
            if (!Utils.isHoliday(date))
            q--;
        }
        return date.getTime();
    }

    static isHoliday(date: Date) {
        const friIsHoly = false;
        const satIsHoly = true;
        const sunIsHoly = true;

        function pad(value: number) {
            const val = '0' + value;
            return val.substr(val.length - 2);
        };

        const holidays = "#01_01#04_25#08_15#11_01#12_25#12_26#06_02#12_08#05_01#2010_04_05#2010_10_19#2010_05_15#2011_04_04#";

        const ymd = "#" + date.getFullYear() + "_" + pad(date.getMonth() + 1) + "_" + pad(date.getDate()) + "#";
        const md = "#" + pad(date.getMonth() + 1) + "_" + pad(date.getDate()) + "#";
        const day = date.getDay();

        return  (day == 5 && friIsHoly) || (day == 6 && satIsHoly) || (day == 0 && sunIsHoly) || holidays.indexOf(ymd) > -1 || holidays.indexOf(md) > -1;
    }

    static recomputeDuration(_start, _end) {
        let pos = new Date(_start);
        pos.setHours(23, 59, 59, 999);
        let days = 0;
        let nd = new Date(_end);
        nd.setHours(23, 59, 59, 999);
        while (pos.getTime() <= nd.getTime()) {
            days = days + (Utils.isHoliday(pos) ? 0 : 1);
            pos.setDate(pos.getDate() + 1);
        }
        return days;
    } 

    static computeEndByDuration(start, duration) {
        let d = new Date(start);
        let q = duration - 1;
        while (q > 0) {
            d.setDate(d.getDate() + 1);
            if (!Utils.isHoliday(d)) q--;
        }
        d.setHours(23, 59, 59, 999);
        return d.getTime();
    }
}


const Messages = {
  "CANNOT_WRITE":                  "CANNOT_WRITE",
  "CHANGE_OUT_OF_SCOPE":                  "NO_RIGHTS_FOR_UPDATE_PARENTS_OUT_OF_EDITOR_SCOPE",
  "START_IS_MILESTONE":                   "START_IS_MILESTONE",
  "END_IS_MILESTONE":                     "END_IS_MILESTONE",
  "TASK_HAS_CONSTRAINTS":                 "TASK_HAS_CONSTRAINTS",
  "GANTT_ERROR_DEPENDS_ON_OPEN_TASK":     "GANTT_ERROR_DEPENDS_ON_OPEN_TASK",
  "GANTT_ERROR_DESCENDANT_OF_CLOSED_TASK":"GANTT_ERROR_DESCENDANT_OF_CLOSED_TASK",
  "TASK_HAS_EXTERNAL_DEPS":               "TASK_HAS_EXTERNAL_DEPS",
  "GANTT_ERROR_LOADING_DATA_TASK_REMOVED":"GANTT_ERROR_LOADING_DATA_TASK_REMOVED",
  "CIRCULAR_REFERENCE":                   "CIRCULAR_REFERENCE",
  "ERROR_SETTING_DATES":                  "ERROR_SETTING_DATES",
  "CANNOT_DEPENDS_ON_ANCESTORS":          "CANNOT_DEPENDS_ON_ANCESTORS",
  "CANNOT_DEPENDS_ON_DESCENDANTS":        "CANNOT_DEPENDS_ON_DESCENDANTS",
  "INVALID_DATE_FORMAT":                  "INVALID_DATE_FORMAT",
  "GANTT_QUARTER_SHORT": "GANTT_QUARTER_SHORT",
  "GANTT_SEMESTER_SHORT":"GANTT_SEMESTER_SHORT",
  "CANNOT_CLOSE_TASK_IF_OPEN_ISSUE":"CANNOT_CLOSE_TASK_IF_OPEN_ISSUE"
};

export class Task {
    public progress: number = 0; // progress of task completion in percents 
    public description: string = ''; // task description for schema panel
    public status: string = 'STATUS_UNDEFINED'; // current task status
    public depends: string = ''; // string of dependencies
    public canWrite: boolean = true; // by default all tasks are writeable
    public startIsMilestone: boolean = false; // ????
    public endIsMilestone: boolean = false; // ????
    public hasExternalDep: boolean = false; // ????
    public rowElement: any; //row editor html element
    public ganttElement: any; //gantt html element
    public master: any;

    public assigs: Array<Assignment> = [];
    constructor(
        public id: number, // unique key
        public name: string, // full name 
        public code: string, // short name
        public level: number, // level in tasks hierarhy, root has 0 level 
        public start: number, // start date of the task 
        public end: number, // end date of the task, 
        public duration: number, // duration in number of days  
        public collapsed: boolean){ // true if task is collapsed and his children are not displayed
    }
 
    clone() {
        let ret = {};
        for (var key in this) {
            if (typeof(this[key]) != 'function') {
                ret[key] = this[key];
            }
        }
        return ret;
    }
    
    getAssigsString() {
        let ret = '';
        this.assigs.forEach((ass)=>{
            let res: any = this.master.getResource(ass.resourceId);
            if (res) {
                ret = ret + (ret == "" ? "" : ", ") + res.name;
            }
        })
        return ret;
    }
 
    createAssignment(id: number, resourceId: number, roleId: number, effort: any) {
        const assig = new Assignment(id, resourceId, roleId, effort);
        this.assigs.push(assig);
        return assig;
    };
    
    getSuperiors() {
        var ret: Array<Link> = [];
        var task = this;
        if (this.master) {
            ret = this.master.links.filter(function(link) {
                return link.to == task;
            });
        }
        return ret;
    };

    //<%---------- SET PERIOD ---------------------- --%>
    setPeriod(_start: number | Date, _end: number | Date) {
        let start: number = (_start instanceof Date) ? _start.getTime() : _start; 
        let end: number = (_end instanceof Date) ? _end.getTime() : _end; 
        
        const originalPeriod = {
            start: this.start,
            end:  this.end,
            duration: this.duration
        };

        const wantedStartMillis = start;

        //cannot start after end
        if (start > end) {
            start = end;
        }

        // set a legal start
        start = Utils.computeStart(start);

        // if this task depends on other tasks => start is set to max end + lag of superior
        var sups = this.getSuperiors();
        if (sups.length > 0) {

            var supEnd = 0;
            for (var i=0;i<sups.length;i++) {
                var link = sups[i];
                supEnd = Math.max(supEnd, Utils.incrementDateByWorkingDays(link.from.end, link.lag) );
            }

            //if changed by depends move it
            if (Utils.computeStart(supEnd) != start) {
                return this.moveTo(supEnd + 1, false);
            }
        }

        var somethingChanged = false;

        //move date to closest day
        var date = new Date(start);

        if (this.start != start || this.start != wantedStartMillis) {
            this.start = start;
            somethingChanged = true;
        }

        //set end
        var wantedEndMillis = end;
        end = Utils.computeEnd(end);

        if (this.end != end || this.end != wantedEndMillis) {
            this.end = end;
            somethingChanged = true;
        }


        this.duration = Utils.recomputeDuration(this.start, this.end);

        //profilerSetPer.stop();

        //nothing changed exit
        if (!somethingChanged)
            return true;

        //cannot write exit
        if(!this.canWrite){
            this.master.setErrorOnTransaction(Messages["CANNOT_WRITE"] + "\n" + this.name, this);
            return false;
        }

        //external dependencies: exit with error
        if (this.hasExternalDep) {
            this.master.setErrorOnTransaction(Messages["TASK_HAS_EXTERNAL_DEPS"] + "\n" + this.name, this);
            return false;
        }

        var todoOk = true;

        //I'm restricting
        var deltaPeriod = originalPeriod.duration - this.duration;
        var restricting = deltaPeriod > 0;
        var restrictingStart = restricting && (originalPeriod.start < this.start);
        var restrictingEnd = restricting && (originalPeriod.end > this.end);

        if (restricting) {
            //loops children to get boundaries
            var children = this.getChildren();
            var bs = Infinity;
            var be = 0;
            for (var i=0;i<children.length;i++) {

                let ch = children[i];

                if (restrictingEnd) {
                    be = Math.max(be, ch.end);
                } else {
                    bs = Math.min(bs, ch.start);
                }
            }

            if (restrictingEnd) {
                this.end = Math.max(be, this.end);
            } else {
                this.start = Math.min(bs, this.start);
            }

            this.duration = Utils.recomputeDuration(this.start, this.end);
        } else {

            //check global boundaries
            if (this.start < this.master.minEditableDate || this.end > this.master.maxEditableDate) {
                this.master.setErrorOnTransaction(Messages["CHANGE_OUT_OF_SCOPE"], this);
                todoOk = false;
            }

            if (todoOk && !updateTree(this)) {
                todoOk = false;
            }
        }

        if (todoOk) {
            //and now propagate to inferiors
            var infs = this.getInferiors();
            if (infs && infs.length > 0) {
            for (var i=0;i<infs.length;i++) {
                var link = infs[i];
                if (!link.to.canWrite){
                this.master.setErrorOnTransaction(Messages["CANNOT_WRITE"] + "\n" + link.to.name, link.to);
                break;
                }
                todoOk = link.to.moveTo(end, false); //this is not the right date but moveTo checks start
                if (!todoOk)
                break;
            }
            }
        }

        return todoOk;
    }

    moveTo(_start: number | Date, ignoreMilestones: boolean) {
        let start: number = (_start instanceof Date) ? _start.getTime() : _start; 

        var originalPeriod = {
            start:this.start,
            end:this.end
        };

        var wantedStartMillis = start;

        //set a legal start
        start = Utils.computeStart(start);

        //if start is milestone cannot be move
        if (!ignoreMilestones && this.startIsMilestone && start != this.start) {
            //notify error
            this.master.setErrorOnTransaction(Messages["START_IS_MILESTONE"], this);
            return false;
        } else if (this.hasExternalDep) {
            //notify error
            this.master.setErrorOnTransaction(Messages["TASK_HAS_EXTERNAL_DEPS"], this);
            return false;
        }

        //if depends start is set to max end + lag of superior
        var sups = this.getSuperiors();
        if (sups && sups.length > 0) {
            var supEnd = 0;
            for (var i=0;i<sups.length;i++) {
            var link = sups[i];
            supEnd = Math.max(supEnd, Utils.incrementDateByWorkingDays(link.from.end, link.lag));
            }
            start = supEnd + 1;
        }
        //set a legal start
        start = Utils.computeStart(start);

        var end = Utils.computeEndByDuration(start, this.duration);

        if (this.start != start || this.start != wantedStartMillis) {
            //in case of end is milestone it never changes, but recompute duration
            if (!ignoreMilestones && this.endIsMilestone) {
            end = this.end;
            this.duration = Utils.recomputeDuration(start, end);
            }
            this.start = start;
            this.end = end;
            //profiler.stop();

            //check global boundaries
            if (this.start < this.master.minEditableDate || this.end > this.master.maxEditableDate) {
            this.master.setErrorOnTransaction(Messages["CHANGE_OUT_OF_SCOPE"], this);
            return false;
            }

            
            var panDelta = originalPeriod.start - this.start;
            //console.debug("panDelta",panDelta);
            //loops children to shift them
            var children = this.getChildren();
            for (var i=0;i<children.length;i++) {
                let ch = children[i];
                if (!ch.moveTo(ch.start - panDelta, false)) {
                    return false;
                }
            }
         
            if (!updateTree(this)) {
                return false;
            }


            //and now propagate to inferiors
            var infs = this.getInferiors();
            if (infs && infs.length > 0) {
                for (var i=0;i<infs.length;i++) {
                    var link = infs[i]; 

                    //this is not the right date but moveTo checks start
                    if (!link.to.canWrite ) {
                        this.master.setErrorOnTransaction(Messages["CANNOT_WRITE"]+ "\n"+link.to.name, link.to);
                    } else if (!link.to.moveTo(end, false)) {
                        return false;
                    }
                }
            }

        }

        return true;
    }

}



function updateTree(task: Task) {
  //console.debug("updateTree ",task);
  let error;

  //try to enlarge parent
  let p: Task = task.getParent();

  //no parent:exit
  if (!p)
    return true;

  var newStart = p.start;
  var newEnd = p.end;

  if (p.start > task.start) {
    if (p.startIsMilestone) {
      task.master.setErrorOnTransaction(Messages["START_IS_MILESTONE"] + "\n" + p.name, task);
      return false;
    } else if (p.depends) {
      task.master.setErrorOnTransaction(Messages["TASK_HAS_CONSTRAINTS"] + "\n" + p.name, task);
      return false;
    }

    newStart = task.start;
  }

  if (p.end < task.end) {
    if (p.endIsMilestone) {
      task.master.setErrorOnTransaction(Messages["END_IS_MILESTONE"] + "\n" + p.name, task);
      return false;
    }

    newEnd = task.end;
  }

  //propagate updates if needed
  if (newStart != p.start || newEnd != p.end) {

    //can write?
    if (!p.canWrite){
      task.master.setErrorOnTransaction(Messages["CANNOT_WRITE"] + "\n" + p.name, task);
      return false;
    }

    //has external deps ?
    if (p.hasExternalDep) {
      task.master.setErrorOnTransaction(Messages["TASK_HAS_EXTERNAL_DEPS"] + "\n" + p.name, task);
      return false;
    }

    return p.setPeriod(newStart, newEnd);
  }


  return true;
}