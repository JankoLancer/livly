require("dotenv").config();
const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const api = require("./api");
const payloads = require("./payloads");
const signature = require("./verifySignature");
const db = require("./database/dbhelperAWS");
const aws = require("aws-sdk");
const CronJob = require("cron").CronJob;

const app = express();

/*
 * Parse application/x-www-form-urlencoded && application/json
 * Use body-parser's `verify` callback to export a parsed raw body
 * that you need to use to verify the signature
 */

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));
app.use(express.static(__dirname + "/public"));

/*
 * Endpoint to receive eoauth_access
 */
app.get("/auth", function (req, res) {
  if (!req.query.code) {
    // access denied
    console.log("Access denied");
    return;
  }

  var data = {
    form: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: req.query.code
    }
  };
  request.post(
    "https://slack.com/api/oauth.v2.access",
    data,
    async (error, response, body) => {
      if (!error && response.statusCode == 200) {
        // Save an auth token (and store the team_id / token)
        const teamId = JSON.parse(body).team.id;
        const accessToken = JSON.parse(body).access_token;

        await db.saveCredential(teamId, accessToken);

        res.redirect("https://slack.com/app_redirect?app=A01D5Q5J6TG");
      }
    }
  );
});

/*
 * Endpoint to receive events from Slack's Events API.
 * It handles `message.im` event callbacks.
 */
app.post("/events", (req, res) => {
  const teamId = req.body.team_id;
  switch (req.body.type) {
    case "url_verification": {
      // verify Events API endpoint by returning challenge if present
      return res.send({ challenge: req.body.challenge });
    }
    case "event_callback": {
      // Verify the signing secret
      if (!signature.isVerified(req)) return res.status(400).send();

      const event = req.body.event;
      // ignore events from bots
      if (event.bot_id) return res.status(200).send();

      handleEvent(event, teamId);
      return res.status(200).send();
    }
    default:
      return res.status(404).send();
  }
});

/*
 * Endpoint to receive events from interactive message and a dialog on Slack.
 * Verify the signing secret before continuing.
 */
app.post("/interactions", async (req, res) => {
  if (!signature.isVerified(req)) return res.status(400).send();

  const payload = JSON.parse(req.body.payload);
  const teamId = payload.team.id;

  if (payload.type === "block_actions") {
    // acknowledge the event before doing heavy-lifting on our servers
    res.status(200).send();

    let action = payload.actions[0];

    switch (action.action_id) {
      case "button_add":
        const channel =
          payload.view.state.values.select.channel_select.selected_conversation;
        if (channel != null) {
          await api.joinChannel(teamId, channel);
          await db.addChannelToCredential(teamId, channel);
          await updateHomePage(payload.user.id, teamId);
        }
        break;
      case "make_leave":
        //TODO: Send locale datetime
        const date = new Date().toISOString().split("T")[0];
        await api.callAPIMethodPost("views.open", teamId, {
          trigger_id: payload.trigger_id,
          view: payloads.request_leave({ date })
        });
        break;
      case "dismiss":
        await api.callAPIMethodPost("chat.delete", teamId, {
          channel: payload.channel.id,
          ts: payload.message.ts
        });
        break;
      case "approve":
        var channels = await api.listAllChannels(
          req.body.payload.api_app_id,
          teamId
        );
        await api.approveLeave(
          payload,
          JSON.parse(action.value).leaveDB,
          channels,
          teamId
        );
        await db.approveLeave(JSON.parse(action.value).leaveDB);
        updateHomePage(payload.user.id, teamId);
        break;
      case "reject":
        await api.callAPIMethodPost("views.open", teamId, {
          trigger_id: payload.trigger_id,
          view: payloads.reject_approve({ leave: action.value })
        });
        break;
      case "cancel":
        await api.callAPIMethodPost("views.open", teamId, {
          trigger_id: payload.trigger_id,
          view: payloads.cancel_approve({ leave: action.value })
        });
        break;
    }
  } else if (payload.type === "view_submission") {
    return handleViewSubmission(payload, res, teamId);
  }

  return res.status(404).send();
});

const notify = async () => {
  const creds = await db.getAllCredential();
  for (var i = 0; i < creds.length; i++) {
    notifyAboutTodayLeaves(creds[i].teamId);
  }

  return res.status(200).send();
}

const notifyAboutTodayLeaves = async teamId => {
  const teamChannel = await db.getChannel(teamId);
  if (teamChannel == null) return; //livly is not part of any channel
  const allActiveDBLeaves = await db.getActiveLeaves(teamId);
  if (allActiveDBLeaves.length == 0) return; //there is no today leaves

  var activeleaves = [];
  for (var i = 0; i < allActiveDBLeaves.length; i++) {
    const leaveDB = allActiveDBLeaves[i];
    activeleaves.push(
      payloads.notify_leave_block({
        user: leaveDB.userId,
        type: leaveDB.type,
        endDate: leaveDB.to
      })
    );
  }

  const dateNow = new Date().setHours(0, 0, 0, 0);
  const leaves = [];
  const leaves_block = payloads.notify_leaves({
    channel: teamChannel,
    date: dateNow,
    leaves: activeleaves
  });

  api.notifyLeaves(teamId, leaves_block);
};

const updateHomePage = async (userId, teamId) => {
  try {
    var errBlocks = [];
    if ((await db.getChannel(teamId)) == null) {
      const errMsg =
        "Livly is not part of any channel. Please, add Livly to a channel where you want notifications to be displayed.";
      errBlocks = payloads.add_to_channel({ msg: errMsg });
    }
    //upcoming leaves
    const allUpcomingDBLeaves = await db.getUpcomingLeaves(teamId);
    var upcomingleaves = [];
    for (var i = 0; i < allUpcomingDBLeaves.length; i++) {
      const leaveDB = allUpcomingDBLeaves[i];
      upcomingleaves.push(payloads.leave_home_desc({ leaveDB }));
    }
    //active leaves
    const allActiveDBLeaves = await db.getActiveLeaves(teamId);
    var activeleaves = [];
    for (var i = 0; i < allActiveDBLeaves.length; i++) {
      const leaveDB = allActiveDBLeaves[i];
      activeleaves.push(payloads.leave_home_desc({ leaveDB }));
    }
    //not approved leaves
    const notApprovedDBLeaves = await db.getNotApprovedByUserId(userId, teamId);
    var notApprovedLeaves = [];
    for (var i = 0; i < notApprovedDBLeaves.length; i++) {
      const leaveDB = notApprovedDBLeaves[i];
      notApprovedLeaves.push(...payloads.leave_home_approve({ leaveDB }));
    }
    //user leaves
    const userDBLeaves = await db.getUserLeaves(userId, teamId);
    var userLeaves = [];
    for (var i = 0; i < userDBLeaves.length; i++) {
      const leaveDB = userDBLeaves[i];
      userLeaves.push(...payloads.leave_home_cancel({ leaveDB }));
    }

    await api.callAPIMethodPost("views.publish", teamId, {
      user_id: userId,
      view: payloads.welcome_home({
        errBlocks,
        userId,
        upcomingleaves,
        activeleaves,
        notApprovedLeaves,
        userLeaves
      })
    });
  } catch (e) {
    console.log(e);
  }
};

/**
 * Handle all incoming events from the Events API
 */
const handleEvent = async (event, teamId) => {
  switch (event.type) {
    case "app_home_opened":
      if (event.tab === "messages") {
        // only send initial message for the first time users opens the messages tab,
        // we can check for that by requesting the message history
        let history = await api.callAPIMethodGet(
          "conversations.history",
          teamId,
          {
            channel: event.channel,
            count: 1
          }
        );

        if (!history.messages.length)
          await api.callAPIMethodPost(
            "chat.postMessage",
            teamId,
            payloads.welcome_message({
              channel: event.channel
            })
          );
      } else if (event.tab === "home") {
        updateHomePage(event.user, teamId);
      }
      break;
    case "message":
      // only respond to new messages posted by user, those won't carry a subtype
      if (!event.subtype) {
        await api.callAPIMethodPost(
          "chat.postMessage",
          teamId,
          payloads.welcome_message({
            channel: event.channel
          })
        );
      }
      break;
    case "app_uninstalled":
      db.deleteCredential(teamId);
      break;
    case "channel_left":
      if ((await db.getChannel(teamId)) == event.channel) {
        await db.addChannelToCredential(teamId, null);
        updateHomePage(event.actor_id, teamId);
      }
      break;
  }
};

/**
 * Handle all Block Kit Modal submissions
 */
const handleViewSubmission = async (payload, res, teamId) => {
  if ((await db.getUser(payload.user)) == null) {
    const userDetails = await api.getUserInfo(payload.user.id, teamId);
    await db.saveUser(userDetails);
  }

  switch (payload.view.callback_id) {
    case "request_leave":
      const values = payload.view.state.values;
      const dateNow = new Date().setHours(0, 0, 0, 0);
      const dateFrom = new Date(values.date_from.date_from.selected_date);
      const dateTo = new Date(values.date_to.date_to.selected_date);
      if (dateNow > dateFrom) {
        return res.send(payloads.dateError({ field: "date_from" }));
      }
      if (dateNow > dateTo) {
        return res.send(payloads.dateError({ field: "date_to" }));
      }
      if (dateFrom > dateTo) {
        return res.send(
          payloads.dateError({
            field: "date_to",
            error: "Less than start date"
          })
        );
      }

      // respond with a stacked modal to the user to confirm selection
      let leave = {
        dateFrom: dateFrom,
        dateTo: dateTo,
        type: values.leave_type.leave_type.selected_option.value,
        approver: values.approver.approver_id.selected_user,
        user: payload.user.id,
        desc: values.desc.desc.value || " "
      };

      return res.send(
        payloads.confirm_leave({
          leave
        })
      );
    case "confirm_leave":
      var newLeave;
      var leaveMsg;
      try {
        newLeave = await db.saveLeave(
          JSON.parse(payload.view.private_metadata),
          teamId
        );

        leaveMsg = await api.requestLeave(payload.user, newLeave, teamId);

        await db.updateLeaveMsg(newLeave, leaveMsg);
      } catch (e) {
        if (newLeave != null) {
          db.deleteLeave(newLeave);
        }
        if (leaveMsg != null) {
          api.deleteMsg(leaveMsg.ts, leaveMsg.channel, teamId);
        }
        console.log(e);
        throw e;
      }

      updateHomePage(payload.user.id, teamId);
      // show a final confirmation modal that the request has been sent
      return res.send(payloads.finish_leave());
    case "cancel_approved":
      await api.cancelLeave(
        payload,
        JSON.parse(payload.view.private_metadata).leaveDB,
        teamId
      );
      await db.cancelLeave(JSON.parse(payload.view.private_metadata).leaveDB);
      updateHomePage(payload.user.id, teamId);
      return res.status(200).send();
    case "reject_approved":
      await api.rejectLeave(
        payload,
        JSON.parse(payload.view.private_metadata).leaveDB,
        teamId
      );
      await db.rejectLeave(JSON.parse(payload.view.private_metadata).leaveDB);
      updateHomePage(payload.user.id, teamId);
      return res.status(200).send();
  }
};

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(
    "Express server listening on port %d in %s mode",
    server.address().port,
    app.settings.env
  );
  
  const awsconfig = {
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_KEY,
    region: "eu-west-1"
  };
  aws.config.update(awsconfig);

});

var job = new CronJob(
  "*/30 * * * *",
  function() {
    notify();
  },
  null,
  true,
  "America/Los_Angeles"
);
job.start();