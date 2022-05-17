class huntercollection {
    constructor() {
        this.count = 0;
        this.innerList = [];
    }

    add(hunter) {
        
        this.innerList.push(hunter);
        this.count = this.innerList.length;
    }
    getHunter(index) {
        return this.innerList[index];
    }
    getById(id) {
        return this.innerList.find(h => h.id == id);
    }
    sort() {
        this.innerList = this.innerList.sort((a, b) => {
            return b.priority - a.priority;
        });
    }
}
var hunters = new huntercollection();
