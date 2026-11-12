import AccessControl "mo:caffeineai-authorization/access-control";
import Invites "mo:caffeineai-user-approval/invites";
import UserApproval "mo:caffeineai-user-approval/approval";
import Map "mo:core/Map";

module {
  public type OldActor = {};

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    approvalState : UserApproval.UserApprovalState;
    invitesState : Invites.InvitesState;
    weeks : {
      var nextId : Nat;
      weeks : Map.Map<Nat, {
        id : Nat;
        owner : Principal;
        startDate : Text;
        tramiteCounts : [{
          tramiteId : Nat;
          day : {
            #viernes;
            #sabado;
            #domingo;
            #lunes;
            #martes;
            #miercoles;
            #jueves;
          };
          count : Nat;
        }];
        indicatorCounts : [{
          indicator : {
            #seguimientoCausa;
            #expedientesAperturados;
            #entrevistas;
          };
          day : {
            #viernes;
            #sabado;
            #domingo;
            #lunes;
            #martes;
            #miercoles;
            #jueves;
          };
          count : Nat;
        }];
        demographics : [{
          day : {
            #viernes;
            #sabado;
            #domingo;
            #lunes;
            #martes;
            #miercoles;
            #jueves;
          };
          ageRange : {
            #nino0a5;
            #nino6a11;
            #nino12a13;
            #adolescente14a17;
            #adulto18mas;
          };
          gender : { #femenino; #masculino };
          count : Nat;
        }];
        createdAt : Int;
        updatedAt : Int;
      }>;
    };
  };

  public func migration(_old : OldActor) : NewActor {
    let accessControlState = AccessControl.initState();
    {
      accessControlState;
      approvalState = UserApproval.initState(accessControlState);
      invitesState = Invites.initState();
      weeks = { var nextId = 0; weeks = Map.empty() };
    };
  };
};
