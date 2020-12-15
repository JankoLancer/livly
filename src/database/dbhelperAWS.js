const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

async function scanAWS(params) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  try {
    return await docClient.scan(params).promise();
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function putAWS(params) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  try {
    return await docClient.put(params).promise();
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function updateAWS(params) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  try {
    return await docClient.update(params).promise();
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function deleteAWS(params) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  try {
    return await docClient.delete(params).promise();
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function saveUser(userDetails) {
  var params = {
    TableName: "user",
    Item: {
      id: uuidv4(),
      username: userDetails.name,
      platformId: userDetails.id,
      teamId: userDetails.team_id,
      realName: userDetails.real_name
    }
  };

  return await putAWS(params);
}

async function getUser(user) {
  const params = {
    TableName: "user",
    ProjectionExpression: "id, realName,username, platform, platformId, teamId",
    FilterExpression: "platformId = :platformId and teamId = :teamId ",
    ExpressionAttributeValues: {
      ":platformId": user.id,
      ":teamId": user.team_id
    }
  };

  const res = await scanAWS(params);

  return res != null && res.Items != null && res.Items.length > 0
    ? res.Items[0]
    : null;
}

async function saveCredential(teamId, token) {
  var params = {
    TableName: "credential",
    Item: {
      teamId: teamId,
      accessToken: token,
      timezone: "Etc/UTC",
      notifyHours: 7,
      notifyMinutes: 30
    }
  };

  return await putAWS(params);
}

async function addChannelToCredential(teamId, channel) {
  var params = {
    TableName: "credential",
    Key: {
      teamId: teamId
    },
    UpdateExpression: "set channelId = :channel",
    ExpressionAttributeValues: {
      ":channel": channel
    },
    ReturnValues: "UPDATED_NEW"
  };

  return await updateAWS(params);
}

async function deleteCredential(teamId) {
  var params = {
    TableName: "credential",    
    Key: {
      teamId: teamId
    }
  };

  return await deleteAWS(params);
}

async function getAllCredential() {
  const params = {
    TableName: "credential"
  };

  const res = await scanAWS(params);

  return res != null ? res.Items : [];
}

async function getCredential(teamId) {
  const params = {
    TableName: "credential",
    FilterExpression: "#team = :teamID",
    ExpressionAttributeNames: {
      "#team": "teamId"
    },
    ExpressionAttributeValues: {
      ":teamID": teamId
    }
  };

  const res = await scanAWS(params);

  return res != null && res.Items != null && res.Items.length > 0
    ? res.Items[0]
    : null;
}

async function getToken(teamId) {
  const credentilDB = await getCredential(teamId);
  return credentilDB != null ? credentilDB.accessToken : null;
}

async function getChannel(teamId) {
  const credentilDB = await getCredential(teamId);
  return credentilDB != null ? credentilDB.channelId : null;
}

async function getUpcomingLeaves(teamId) {
  const dateNow = new Date().setHours(0, 0, 0, 0);

  const params = {
    TableName: "leave",
    ProjectionExpression:
      "id, #from, #to, #type, #desc, userId, approverId, teamId, approved, rejected, canceled, msgTs, msgChannel",
    FilterExpression:
      "teamId = :teamId and canceled = :false and approved = :true and #from > :dateNow",
    ExpressionAttributeNames: {
      "#from": "from",
      "#to": "to",
      "#type": "type",
      "#desc": "desc"
    },
    ExpressionAttributeValues: {
      ":teamId": teamId,
      ":dateNow": dateNow,
      ":false": false,
      ":true": true
    }
  };

  const res = await scanAWS(params);
  return res == null ? [] : res.Items;
}

async function getActiveLeaves(teamId) {
  const dateNow = new Date().setHours(0, 0, 0, 0);

  const params = {
    TableName: "leave",
    ProjectionExpression:
      "id, #from, #to, #type, #desc, userId, approverId, teamId, approved, rejected, canceled, msgTs, msgChannel",
    FilterExpression:
      "teamId = :teamId and canceled = :false and approved = :true and #from <= :dateNow and #to >= :dateNow",
    ExpressionAttributeNames: {
      "#from": "from",
      "#to": "to",
      "#type": "type",
      "#desc": "desc"
    },
    ExpressionAttributeValues: {
      ":teamId": teamId,
      ":dateNow": dateNow,
      ":false": false,
      ":true": true
    }
  };

  const res = await scanAWS(params);
  return res == null ? [] : res.Items;
}

async function getNotApprovedByUserId(userId, teamId) {
  const params = {
    TableName: "leave",
    ProjectionExpression:
      "id, #from, #to, #type, #desc, userId, approverId, teamId, approved, rejected, canceled, msgTs, msgChannel",
    FilterExpression:
      "teamId = :teamId and approverId = :approverId and canceled = :false and approved = :false and rejected = :false",
    ExpressionAttributeNames: {
      "#from": "from",
      "#to": "to",
      "#type": "type",
      "#desc": "desc"
    },
    ExpressionAttributeValues: {
      ":teamId": teamId,
      ":approverId": userId,
      ":false": false
    }
  };

  const res = await scanAWS(params);
  return res == null ? [] : res.Items;
}

async function getUserLeaves(userId, teamId) {
  const params = {
    TableName: "leave",
    ProjectionExpression:
      "id, #from, #to, #type, #desc, userId, approverId, teamId, approved, rejected, canceled, msgTs, msgChannel",
    FilterExpression:
      "teamId = :teamId and userId = :userId and canceled = :false and rejected = :false",
    ExpressionAttributeNames: {
      "#from": "from",
      "#to": "to",
      "#type": "type",
      "#desc": "desc"
    },
    ExpressionAttributeValues: {
      ":teamId": teamId,
      ":userId": userId,
      ":false": false
    }
  };

  const res = await scanAWS(params);
  return res == null ? [] : res.Items;
}

async function updateLeaveMsg(leave, msg) {
  var params = {
    TableName: "leave",
    Key: {
      id: leave.id
    },
    UpdateExpression: "set msgTs = :msgTsNew, msgChannel = :msgChannelNew",
    ExpressionAttributeValues: {
      ":msgTsNew": msg.ts,
      ":msgChannelNew": msg.channel
    },
    ReturnValues: "UPDATED_NEW"
  };

  return await updateAWS(params);
}

async function deleteLeave(leave) {
  var params = {
    TableName: "leave",
    Key: {
      id: leave.id
    }
  };

  return await deleteAWS(params);
}

async function approveLeave(leave) {
  var params = {
    TableName: "leave",
    Key: {
      id: leave.id
    },
    UpdateExpression: "set approved = :newValue",
    ExpressionAttributeValues: {
      ":newValue": true
    },
    ReturnValues: "UPDATED_NEW"
  };

  return await updateAWS(params);
}

async function rejectLeave(leave) {
  var params = {
    TableName: "leave",
    Key: {
      id: leave.id
    },
    UpdateExpression: "set rejected = :newValue",
    ExpressionAttributeValues: {
      ":newValue": true
    },
    ReturnValues: "UPDATED_NEW"
  };

  return await updateAWS(params);
}

async function cancelLeave(leave) {
  var params = {
    TableName: "leave",
    Key: {
      id: leave.id
    },
    UpdateExpression: "set canceled = :newValue",
    ExpressionAttributeValues: {
      ":newValue": true
    },
    ReturnValues: "UPDATED_NEW"
  };

  return await updateAWS(params);
}

async function getLeave(id) {
  const params = {
    TableName: "leave",
    ProjectionExpression:
      "id, #from, #to, #type, #desc, userId, approverId, teamId, approved, rejected, canceled, msgTs, msgChannel",
    FilterExpression: "id = :leaveId",
    ExpressionAttributeNames: {
      "#from": "from",
      "#to": "to",
      "#type": "type",
      "#desc": "desc"
    },
    ExpressionAttributeValues: {
      ":leaveId": id
    }
  };

  const res = await scanAWS(params);

  return res != null && res.Items != null && res.Items.length > 0
    ? res.Items[0]
    : null;
}

async function saveLeave(leave, teamId) {
  var params = {
    TableName: "leave",
    Item: {
      id: uuidv4(),
      teamId,
      teamId,
      from: Date.parse(leave.dateFrom),
      to: Date.parse(leave.dateTo),
      type: leave.type,
      desc: leave.desc,
      userId: leave.user,
      approverId: leave.approver,
      approved: false,
      canceled: false,
      rejected: false
    }
  };

  var res = await putAWS(params);

  return params.Item;
}

module.exports = {
  saveUser,
  getUser,
  saveCredential,
  getAllCredential,
  deleteCredential,
  addChannelToCredential,
  getToken,
  getCredential,
  getChannel,
  updateLeaveMsg,
  getActiveLeaves,
  getUserLeaves,
  getUpcomingLeaves,
  getNotApprovedByUserId,
  saveLeave,
  deleteLeave,
  cancelLeave,
  approveLeave,
  rejectLeave,
  getLeave
};
