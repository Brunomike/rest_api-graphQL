const getTimestamp = () => {
    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth() + 1);
    let dateT = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    month < 10 ? month = `0${month}` : month;
    dateT < 10 ? dateT = `0${dateT}` : dateT;
    hours < 10 ? hours = `0${hours}` : hours;
    minutes < 10 ? minutes = `0${minutes}` : minutes;
    seconds < 10 ? seconds = `0${seconds}` : seconds;

    const timestamp = `${year}-${month}-${dateT}-${hours}-${minutes}-${seconds}`;
    console.log(timestamp);

    return timestamp;
};

//getTimestamp();

module.exports = getTimestamp;