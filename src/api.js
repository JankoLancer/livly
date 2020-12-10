"use strict";

const axios = require("axios");
const payloads = require("./payloads");
const apiUrl = "https://slack.com/api";

const db = require("./database/dbhelperAWS");

/**
 * helper function to call POST methods of Slack API
 */
const callAPIMethodPost = async (method, teamId, payload) => {
  console.log(method, teamId, payload);
  const token = await db.getToken(teamId);
  let result = await axios.post(`${apiUrl}/${method}`, payload, {
    headers: { Authorization: "Bearer " + token }
  });
  return result.data;
};

/**
 * helper function to call GET methods of Slack API
 */
const callAPIMethodGet = async (method, teamId, payload) => {
  const token = await db.getToken(teamId);
  payload.token = token;
  let params = Object.keys(payload)
    .map(key => `${key}=${payload[key]}`)
    .join("&");
  let result = await axios.get(`${apiUrl}/${method}?${params}`);
  return result.data;
};

/**
 * helper function to receive all channels our bot user is a member of
 */
const listAllChannels = async (userId, teamId) => {
  let res = await callAPIMethodPost("users.conversations", teamId, {
    user: userId
  });
  return res.channels;
};

/**
 * helper function to receive all users in workspace
 */
const listAllUsers = async teamId => {
  let res = await callAPIMethodPost("users.list", teamId, {});
  return res.members
    .filter(member => member.deleted == false && member.is_bot == false)
    .map(member => member.id);
};

const inviteAllUsersToChannel = async teamId => {
  const channel = await db.getChannel(teamId);
  const allUsers = listAllUsers(teamId);

  let res = await callAPIMethodPost("conversations.invite", teamId, {
    channel: channel,
    users: allUsers.join(",")
  });
  console.log(res);
  return res;
};

/**
 * helper function to create new channel
 */
const createChannel = async (teamId, name) => {
  let res = await callAPIMethodPost("conversations.create", teamId, {
    name: name
  });
  return res.channel.id;
};

/**
 * helper function to create new channel
 */
const joinChannel = async (teamId, channel) => {
  let res = await callAPIMethodPost("conversations.join", teamId, {
    channel: channel
  });
  return res;
};

/**
 * helper function to receive user info
 */
const getUserInfo = async (userId, teamId) => {
  let res = await callAPIMethodGet("users.info", teamId, {
    user: userId
  });
  return res.user;
};

/**
 * function to delete msg
 */
const deleteMsg = async (msgTs, msgChannel, teamId) => {
  let res = await callAPIMethodPost("chat.delete", teamId, {
    ts: msgTs,
    channel: msgChannel
  });
};

/**
 * function to send the approver a direct message with "Approve" and "Reject" buttons
 */
const requestLeave = async (user, leaveDB, teamId) => {
  let res = await callAPIMethodPost("conversations.open", teamId, {
    users: leaveDB.approverId
  });
  leaveDB.requester = user.id;
  leaveDB.channel = res.channel.id;
  return await callAPIMethodPost(
    "chat.postMessage",
    teamId,
    payloads.approve({ leaveDB })
  );
};

/**
 * function for leave approval
 */
const approveLeave = async (payload, leave, channels, teamId) => {
  leave = await db.getLeave(leave.id);
  // 1. update the approver's message that this request has been approved
  await callAPIMethodPost("chat.update", teamId, {
    channel: leave.msgChannel,
    ts: leave.msgTs,
    text: "Thanks! Leave request is approved.",
    blocks: null
  });

  // 2. send a notification to the requester
  let res = await callAPIMethodPost("conversations.open", teamId, {
    users: leave.userId
  });

  await callAPIMethodPost(
    "chat.postMessage",
    teamId,
    payloads.rejected_approved({
      channel: res.channel.id,
      msg: "approved",
      leave: leave
    })
  );

  // 3. send a notification of new leave to all channels
  channels.forEach(channel => {
    callAPIMethodPost(
      "chat.postMessage",
      teamId,
      payloads.leave_channel_leave({
        channel: channel.id,
        leave: leave
      })
    );
  });
};

/**
 * function for leave reject
 */
const rejectLeave = async (payload, leave, teamId) => {
  leave = await db.getLeave(leave.id);
  // 1. update the approver's message that this request has been denied
  await callAPIMethodPost("chat.update", teamId, {
    channel: leave.msgChannel,
    ts: leave.msgTs,
    text: "This request has been denied. I am letting the requester know!",
    blocks: null
  });

  // 2. send a notification to the requester
  let res = await callAPIMethodPost("conversations.open", teamId, {
    users: leave.userId
  });

  await callAPIMethodPost(
    "chat.postMessage",
    teamId,
    payloads.rejected_approved({
      channel: res.channel.id,
      msg: "rejected",
      leave: leave
    })
  );
};

/**
 * function for leave cancel
 */
const cancelLeave = async (payload, leave, teamId) => {
  leave = await db.getLeave(leave.id);
  // 1. update the approver's message that this request has been denied
  await callAPIMethodPost("chat.update", teamId, {
    channel: leave.msgChannel,
    ts: leave.msgTs,
    text: "Leave request has been canceled.",
    blocks: null
  });

  // 2. send a notification to the requester
  let res = await callAPIMethodPost("conversations.open", teamId, {
    users: leave.userId
  });

  await callAPIMethodPost(
    "chat.postMessage",
    teamId,
    payloads.rejected_approved({
      channel: res.channel.id,
      msg: "canceled",
      leave: leave
    })
  );
};

const notifyLeaves = async (teamId, leaves_block) => {
  await callAPIMethodPost(
    "chat.postMessage",
    teamId,
    leaves_block
  );
};

module.exports = {
  callAPIMethodPost,
  callAPIMethodGet,
  rejectLeave,
  cancelLeave,
  inviteAllUsersToChannel,
  approveLeave,
  requestLeave,
  createChannel,
  joinChannel,
  listAllChannels,
  listAllUsers,
  getUserInfo,
  deleteMsg,
  notifyLeaves
};
