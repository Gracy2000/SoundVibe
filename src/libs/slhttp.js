class slHTTP {
    async get(url , headers){
            const requestInfo = {
                method: 'GET',
                headers,
            }
            const res = await fetch(url ,requestInfo);
            const data = await this.responseHelper(res);
            return data;
    }
    async post(url, data, headers){
            const requestInfo = {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            }
            const res = await fetch(url, requestInfo);
            const resData = await this.responseHelper(res);
            return resData;
    }
    async put(url, data, headers){
            const requestInfo = {
                method: 'PUT',
                headers,
                body: JSON.stringify(data)
            }
            const res = await fetch(url, requestInfo);
            const resData = await this.res;
            return resData;
    }
    async delete(url, headers){
            const requestInfo = {
                method: 'DELETE',
                headers,
            }
            const res = await fetch(url, requestInfo);
            const resData = await this.res;
            return {status: 200, message: 'Resource Deleted... '};
    }
    async responseHelper(res){
        if(res.ok)
            return res.json();
        throw res;
    }
}

const http = new slHTTP();
export default http;