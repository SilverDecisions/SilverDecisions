import {JobRepository} from "./job-repository";
import {default as idb} from "idb";
import * as _ from "lodash";
import {JobExecution} from "../job-execution";
import {JobInstance} from "../job-instance";
import {StepExecution} from "../step-execution";
import {ExecutionContext} from "../execution-context";
import {DataModel} from "sd-model";

/* IndexedDB job repository*/
export class IdbJobRepository extends JobRepository {

    dbPromise;
    jobInstanceDao;
    jobExecutionDao;
    stepExecutionDao;
    jobExecutionProgressDao;
    jobExecutionFlagDao;

    constructor(expressionsReviver, dbName ='sd-job-repository', deleteDB=false) {
        super();
        this.dbName=dbName;
        this.expressionsReviver = expressionsReviver;
        if(deleteDB){
            this.deleteDB().then(()=>{
                this.initDB()
            })
        }else{
            this.initDB()
        }


        this.jobInstanceDao = new ObjectStoreDao('job-instances', this.dbPromise);
        this.jobExecutionDao = new ObjectStoreDao('job-executions', this.dbPromise);
        this.jobExecutionProgressDao = new ObjectStoreDao('job-execution-progress', this.dbPromise);
        this.jobExecutionFlagDao = new ObjectStoreDao('job-execution-flags', this.dbPromise);

        this.stepExecutionDao = new ObjectStoreDao('step-executions', this.dbPromise);
    }

    initDB(){
        this.dbPromise = idb.open(this.dbName, 1, upgradeDB => {
            upgradeDB.createObjectStore('job-instances');
            var jobExecutionsOS = upgradeDB.createObjectStore('job-executions');
            jobExecutionsOS.createIndex("jobInstanceId", "jobInstance.id", { unique: false });
            jobExecutionsOS.createIndex("createTime", "createTime", { unique: false });
            jobExecutionsOS.createIndex("status", "status", { unique: false });
            upgradeDB.createObjectStore('job-execution-progress');
            upgradeDB.createObjectStore('job-execution-flags');
            var stepExecutionsOS = upgradeDB.createObjectStore('step-executions');
            stepExecutionsOS.createIndex("jobExecutionId", "jobExecution.id", { unique: false });
        });
    }

    deleteDB(){
        return Promise.resolve().then(_=>idb.delete(this.dbName));
    }

    /*returns promise*/
    getJobInstance(jobName, jobParameters) {
        var key = this.generateJobInstanceKey(jobName, jobParameters);
        return this.jobInstanceDao.get(key).then(dto=>dto ? this.reviveJobInstance(dto): dto);
    }

    /*should return promise that resolves to saved instance*/
    saveJobInstance(jobInstance, jobParameters) {
        var key = this.generateJobInstanceKey(jobInstance.jobName, jobParameters);
        return this.jobInstanceDao.set(key, jobInstance).then(r=>jobInstance);
    }

    /*should return promise that resolves to saved jobExecution*/
    saveJobExecution(jobExecution) {
        var dto = jobExecution.getDTO();
        return this.jobExecutionDao.set(jobExecution.id, dto).then(r=>jobExecution);
    }

    updateJobExecutionProgress(jobExecutionId, progress){
        return this.jobExecutionProgressDao.set(jobExecutionId, progress)
    }

    getJobExecutionProgress(jobExecutionId){
        return this.jobExecutionProgressDao.get(jobExecutionId)
    }

    saveJobExecutionFlag(jobExecutionId, flag){
        return this.jobExecutionFlagDao.set(jobExecutionId, flag)
    }

    getJobExecutionFlag(jobExecutionId){
        return this.jobExecutionFlagDao.get(jobExecutionId)
    }

    /*should return promise which resolves to saved stepExecution*/
    saveStepExecution(stepExecution) {
        var dto = stepExecution.getDTO();
        return this.jobExecutionDao.set(stepExecution.id, dto).then(r=>stepExecution);
    }

    getJobExecutionById(id){
        return this.jobExecutionDao.get(id).then(dto=>dto ? this.reviveJobExecution(dto): dto);
    }

    /*find job executions sorted by createTime, returns promise*/
    findJobExecutions(jobInstance) {
        return this.jobExecutionDao.getAllByIndex("jobInstanceId", jobInstance.id).then(values=> {
            return values.sort(function (a, b) {
                return a.createTime.getTime() - b.createTime.getTime()
            }).map(this.reviveJobExecution, this);
        });
    }

    reviveJobInstance(dto) {
        return new JobInstance(dto.id, dto.jobName);
    }

    reviveExecutionContext(dto) {
        var executionContext = new ExecutionContext();
        executionContext.context = dto.context;
        var data = executionContext.getData();
        if(data){
            var dataModel = new DataModel();
            dataModel.loadFromDTO(data, this.expressionsReviver);
            executionContext.setData(dataModel);
        }
        return executionContext
    }

    reviveJobExecution(dto) {

        var job = this.getJobByName(dto.jobInstance.jobName);
        var jobInstance = this.reviveJobInstance(dto.jobInstance);
        var jobParameters = job.createJobParameters(dto.jobParameters.values);
        var jobExecution = new JobExecution(jobInstance, jobParameters, dto.id);
        var executionContext = this.reviveExecutionContext(dto.executionContext);
        return _.mergeWith(jobExecution, dto, (objValue, srcValue, key, object, source, stack)=> {
            if (key === "jobInstance") {
                return jobInstance;
            }
            if (key === "executionContext") {
                return executionContext;
            }
            if (key === "jobParameters") {
                return jobParameters;
            }
            if (key === "jobExecution") {
                return jobExecution;
            }

            if (key === "stepExecutions") {
                return srcValue.map(stepDTO => this.reviveStepExecution(stepDTO, jobExecution));
            }
        })
    }

    reviveStepExecution(dto, jobExecution) {
        var stepExecution = new StepExecution(dto.stepName, jobExecution, dto.id);
        var executionContext = this.reviveExecutionContext(dto.executionContext);
        return _.mergeWith(stepExecution, dto, (objValue, srcValue, key, object, source, stack)=> {
            if (key === "jobExecution") {
                return jobExecution;
            }
            if (key === "executionContext") {
                return executionContext;
            }
        })
    }
}


class ObjectStoreDao {

    name;
    dbPromise;

    constructor(name, dbPromise) {
        this.name = name;
        this.dbPromise = dbPromise;
    }

    get(key) {
        return this.dbPromise.then(db => {
            return db.transaction(this.name)
                .objectStore(this.name).get(key);
        });
    }

    getAllByIndex(indexName, key){
        return this.dbPromise.then(db => {
            return db.transaction(this.name)
                .objectStore(this.name).index(indexName).getAll(key)
        });
    }

    getByIndex(indexName, key){
        return this.dbPromise.then(db => {
            return db.transaction(this.name)
                .objectStore(this.name).index(indexName).get(key)
        });
    }

    set(key, val) {
        return this.dbPromise.then(db => {
            const tx = db.transaction(this.name, 'readwrite');
            tx.objectStore(this.name).put(val, key);
            return tx.complete;
        });
    }

    remove(key) {
        return this.dbPromise.then(db => {
            const tx = db.transaction(this.name, 'readwrite');
            tx.objectStore(this.name).delete(key);
            return tx.complete;
        });
    }

    clear() {
        return this.dbPromise.then(db => {
            const tx = db.transaction(this.name, 'readwrite');
            tx.objectStore(this.name).clear();
            return tx.complete;
        });
    }

    keys() {
        return this.dbPromise.then(db => {
            const tx = db.transaction(this.name);
            const keys = [];
            const store = tx.objectStore(this.name);

            // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
            // openKeyCursor isn't supported by Safari, so we fall back
            (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
                if (!cursor) return;
                keys.push(cursor.key);
                cursor.continue();
            });

            return tx.complete.then(() => keys);
        });
    }
}
