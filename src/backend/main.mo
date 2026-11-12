import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinUserApproval "mo:caffeineai-user-approval/MixinUserApproval";
import MixinMemberInvites "mo:caffeineai-user-approval/MixinMemberInvites";
import UserApproval "mo:caffeineai-user-approval/approval";
import Invites "mo:caffeineai-user-approval/invites";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Principal "mo:core/Principal";

import WeeksLib "lib/weeks";
import Types "types/weeks";
import WeeksApi "mixins/weeks-api";
import CatalogApi "mixins/catalog-api";
import AccessApi "mixins/access-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let approvalState : UserApproval.UserApprovalState;
  include MixinUserApproval(accessControlState, approvalState);

  let invitesState : Invites.InvitesState;
  include MixinMemberInvites(accessControlState, approvalState, invitesState);

  let weeks : WeeksLib.State;

  include WeeksApi(weeks, accessControlState, approvalState);
  include CatalogApi();
  include AccessApi(accessControlState, approvalState);
  include ApiDocMixin();

  transient let sampleOwner = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      weeks.weeks.toEntityManual("week", "WeekRecord", "id")
        .sample({
          id = 0;
          owner = sampleOwner;
          startDate = "";
          tramiteCounts = [];
          indicatorCounts = [];
          demographics = [];
          createdAt = 0;
          updatedAt = 0;
        })
        .payload("id", func w = w.id)
        .payload("owner", func w = w.owner)
        .payload("startDate", func w = w.startDate)
        .payload("tramiteCount", func w = w.tramiteCounts.size())
        .payload("indicatorCount", func w = w.indicatorCounts.size())
        .payload("demographicCount", func w = w.demographics.size())
        .payload("createdAt", func w = w.createdAt)
        .payload("updatedAt", func w = w.updatedAt)
        .ownedBy("owner")
        .scopedPerUser()
        .build(),
    ];
  });
};
