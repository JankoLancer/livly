module.exports = {
  short_message: context => {
    return {
      channel: context.channel,
      text: context.text
    };
  },
  welcome_message: context => {
    return {
      channel: context.channel,
      text:
        ":wave: Hello there mate! I'm here to help you manage your leave so your team knows when you are OOO. To start click on button bellow to create leave.",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              ":wave: Hello there mate! I'm here to help you manage your leave so your team knows when you are OOO. To start click on button bellow to create leave."
          }
        },
        {
          type: "actions",
          elements: [
            {
              action_id: "make_leave",
              type: "button",
              text: {
                type: "plain_text",
                text: "Create Leave"
              },
              style: "primary",
              value: "make_leave"
            }
          ]
        }
      ]
    };
  },
  leave_home_desc: context => {
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<@${context.leaveDB.userId}> will be on leave ${new Date(
          context.leaveDB.from
        ).toDateString()} to ${new Date(context.leaveDB.to).toDateString()}`
      }
    };
  },
  leave_home_approve: context => {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<@${context.leaveDB.userId}> will be on leave ${new Date(
            context.leaveDB.from
          ).toDateString()} to ${new Date(context.leaveDB.to).toDateString()}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            action_id: "approve",
            type: "button",
            text: {
              type: "plain_text",
              text: "Approve",
              emoji: true
            },
            style: "primary",
            value: JSON.stringify(context)
          },
          {
            action_id: "reject",
            type: "button",
            text: {
              type: "plain_text",
              text: "Reject",
              emoji: true
            },
            style: "danger",
            value: JSON.stringify(context)
          }
        ]
      }
    ];
  },
  leave_home_cancel: context => {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `You will be on leave ${new Date(
            context.leaveDB.from
          ).toDateString()} to ${new Date(context.leaveDB.to).toDateString()}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            action_id: "cancel",
            type: "button",
            text: {
              type: "plain_text",
              text: "Cancel",
              emoji: true
            },
            style: "danger",
            value: JSON.stringify(context)
          }
        ]
      }
    ];
  },
  add_to_channel: context => {
    return [
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${context.msg}`
        }
      },
      {
        type: "actions",
        block_id: "select",
        elements: [
          {
            type: "conversations_select",
            placeholder: {
              type: "plain_text",
              text: "Select channel",
              emoji: true
            },
            filter: {
              include: ["public"]
            },
            action_id: "channel_select"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Add livly to channel"
            },
            style: "primary",
            value: JSON.stringify(context),
            action_id: "button_add"
          }
        ]
      },
      {
        type: "divider"
      }
    ];
  },
  welcome_home: context => {
    return {
      type: "home",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:mage: Hello there <@${context.userId}>! It's your pal Livly :seedling:. I'm here to help you manage your leave so your team knows when you are OOO. To start click on button bellow to create leave.`
          }
        },
        ...context.errBlocks,
        {
          type: "actions",
          elements: [
            {
              action_id: "make_leave",
              type: "button",
              text: {
                type: "plain_text",
                text: "Create Leave"
              },
              style: "primary",
              value: "make_leave"
            }
          ]
        },
        {
          type: "header",
          text: {
            type: "plain_text",
            text: ":clock7: Active leave",
            emoji: true
          }
        },
        {
          type: "divider"
        },
        ...context.activeleaves,
        {
          type: "header",
          text: {
            type: "plain_text",
            text: ":date: Upcoming leave",
            emoji: true
          }
        },
        {
          type: "divider"
        },
        ...context.upcomingleaves,
        {
          type: "header",
          text: {
            type: "plain_text",
            text: ":hourglass_flowing_sand: Pending leave",
            emoji: true
          }
        },
        {
          type: "divider"
        },
        ...context.notApprovedLeaves,
        {
          type: "header",
          text: {
            type: "plain_text",
            text: ":outbox_tray: My requests",
            emoji: true
          }
        },
        {
          type: "divider"
        },
        ...context.userLeaves
      ]
    };
  },
  reject_approve: context => {
    return {
      type: "modal",
      title: {
        type: "plain_text",
        text: "Reject a leave"
      },
      callback_id: "reject_approved",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Are you sure you want to reject this leave?",
            emoji: true
          }
        }
      ],
      close: {
        type: "plain_text",
        text: "No"
      },
      submit: {
        type: "plain_text",
        text: "Yes"
      },
      private_metadata: context.leave
    };
  },
  cancel_approve: context => {
    return {
      type: "modal",
      title: {
        type: "plain_text",
        text: "Cancel a leave"
      },
      callback_id: "cancel_approved",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Are you sure you want to cancel your leave?",
            emoji: true
          }
        }
      ],
      close: {
        type: "plain_text",
        text: "No"
      },
      submit: {
        type: "plain_text",
        text: "Yes"
      },
      private_metadata: context.leave
    };
  },
  request_leave: context => {
    return {
      type: "modal",
      title: {
        type: "plain_text",
        text: "Request a leave"
      },
      callback_id: "request_leave",
      blocks: [
        {
          type: "input",
          block_id: "date_from",
          label: {
            type: "plain_text",
            text: "From"
          },
          element: {
            type: "datepicker",
            action_id: "date_from",
            initial_date: context.date,
            placeholder: {
              type: "plain_text",
              text: "Select start date"
            }
          }
        },
        {
          type: "input",
          block_id: "date_to",
          label: {
            type: "plain_text",
            text: "To"
          },
          element: {
            type: "datepicker",
            action_id: "date_to",
            initial_date: context.date,
            placeholder: {
              type: "plain_text",
              text: "Select end date"
            }
          }
        },
        {
          type: "input",
          block_id: "leave_type",
          label: {
            type: "plain_text",
            text: "Leave type"
          },
          element: {
            action_id: "leave_type",
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Select an item"
            },
            initial_option: {
              text: {
                type: "plain_text",
                text: "Vacation"
              },
              value: "vacation"
            },
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "Vacation"
                },
                value: "vacation"
              },
              {
                text: {
                  type: "plain_text",
                  text: "Sick"
                },
                value: "sick"
              }
            ]
          }
        },
        {
          block_id: "approver",
          type: "input",
          label: {
            type: "plain_text",
            text: "Approver"
          },
          element: {
            action_id: "approver_id",
            type: "users_select"
          }
        },
        {
          block_id: "desc",
          type: "input",
          label: {
            type: "plain_text",
            text: "Notes"
          },
          optional: true,
          element: {
            action_id: "desc",
            type: "plain_text_input",
            max_length: 150,
            placeholder: {
              type: "plain_text",
              text:
                "eg. I am on vacation untill Jul 15th. If you have some urgent issue, please, write me email with urgent in subject."
            },
            multiline: true
          }
        }
      ],
      submit: {
        type: "plain_text",
        text: "Next"
      }
    };
  },
  confirm_leave: context => {
    return {
      response_action: "push",
      view: {
        callback_id: "confirm_leave",
        type: "modal",
        title: {
          type: "plain_text",
          text: "Confirm leave request"
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*From*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.dateFrom.toDateString()
            }
          },

          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*To*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.dateTo.toDateString()
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Leave type*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.type
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Notes*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: context.leave.desc
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*APPROVER*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<@${context.leave.approver}>`
            }
          }
        ],
        close: {
          type: "plain_text",
          text: "Back"
        },
        submit: {
          type: "plain_text",
          text: "Submit"
        },
        private_metadata: JSON.stringify(context.leave)
      }
    };
  },
  finish_leave: context => {
    return {
      response_action: "update",
      view: {
        callback_id: "finish_leave",
        clear_on_close: true,
        type: "modal",
        title: {
          type: "plain_text",
          text: "Success :tada:",
          emoji: true
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Your leave request has been sent for approval."
            }
          }
        ],
        close: {
          type: "plain_text",
          text: "Done"
        }
      }
    };
  },
  approve: context => {
    return {
      channel: context.leaveDB.channel,
      text: `<@${context.leaveDB.requester}> asked for *approval* of following leave request`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${context.leaveDB.requester}> asked for *approval* of following leave request:`
          }
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: " ",
            emoji: true
          }
        },
        {
          type: "section",
          block_id: "table",
          fields: [
            {
              type: "mrkdwn",
              text: `*From:* ${new Date(context.leaveDB.from).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*To:* ${new Date(context.leaveDB.to).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*Leave type:* ${context.leaveDB.type} :palm_tree:`
            },
            {
              type: "mrkdwn",
              text: `*Notes:* ${context.leaveDB.desc}`
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "actions",
          block_id: "actionblock789",
          elements: [
            {
              action_id: "approve",
              type: "button",
              text: {
                type: "plain_text",
                text: "Approve",
                emoji: true
              },
              style: "primary",
              value: JSON.stringify(context)
            },
            {
              action_id: "reject",
              type: "button",
              text: {
                type: "plain_text",
                text: "Reject",
                emoji: true
              },
              style: "danger",
              value: JSON.stringify(context)
            }
          ]
        }
      ]
    };
  },
  rejected_approved: context => {
    return {
      channel: context.channel,
      text: `Your leave request has been ${context.msg}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Your leave request has been ${context.msg}!`
          }
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: " ",
            emoji: true
          }
        },
        {
          type: "section",
          block_id: "table",
          fields: [
            {
              type: "mrkdwn",
              text: `*From:* ${new Date(context.leave.from).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*To:* ${new Date(context.leave.to).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*Leave type:* ${context.leave.type}`
            },
            {
              type: "mrkdwn",
              text: `*Notes:* ${context.leave.desc}`
            }
          ]
        }
      ]
    };
  },
  leave_channel_leave: context => {
    return {
      channel: context.channel,
      text: `:loudspeaker: New leave from <@${context.leave.userId}>`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${context.leave.userId}> will be on leave`
          }
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: " ",
            emoji: true
          }
        },
        {
          type: "section",
          block_id: "table",
          fields: [
            {
              type: "mrkdwn",
              text: `*From:* ${new Date(context.leave.from).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*To:* ${new Date(context.leave.to).toDateString()}`
            },
            {
              type: "mrkdwn",
              text: `*Leave type:* ${context.leave.type}`
            },
            {
              type: "mrkdwn",
              text: `*Notes:* ${context.leave.desc}`
            }
          ]
        }
      ]
    };
  },
  notify_leave_block: context => {
    return {
      type: "section",
      text:
        context.type == "vacation"
          ? {
              type: "mrkdwn",
              text: `:palm_tree: <@${context.user}> - until ${new Date(
                context.endDate
              ).toDateString()}`
            }
          : {
              type: "mrkdwn",
              text: `:thermometer: <@${context.user}> - until ${new Date(
                context.endDate
              ).toDateString()}`
            }
    };
  },
  notify_leaves: context => {
    return {
      channel: context.channel,
      text: `:loudspeaker: Today leave list is ready!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "plain_text",
            text: `:alarm_clock: Here's who is out today ${new Date(
              context.date
            ).toDateString()}:`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: " ",
            emoji: true
          }
        },
        ...context.leaves,
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "plain_text",
              text: ":palm_tree: = Vacation  :thermometer: = Sick",
              emoji: true
            }
          ]
        }
      ]
    };
  },
  dateError: context => {
    return {
      response_action: "errors",
      errors: {
        [context.field]:
          context.error || "You may not select a due date in the past"
      }
    };
  }
};
