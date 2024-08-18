use std::{any::Any, vec};

use client::{Client, ClientResult, ClientResultState, ClientSelfState, ClientState};
use state_mng::state;
use tokio::sync::broadcast::{self, error::RecvError};

use crate::state_mng::state::{PipeState, State, StateTag};

// mod bloc;
mod client;
mod state_mng;

#[tokio::main]
async fn main() {
    println!("Hello, world!");
    let unknown_state: PipeState = PipeState::unknown();
    let state0 = PipeState::new(0);

    // let st0 = StreamableState::new(state0);

    // println!("{:?}", st0);

    let (tx, mut rx1) = broadcast::channel(16);
    // let mut rx2 = tx.subscribe();

    let server_id = uuid::Uuid::new_v4().to_string();

    let my_id = uuid::Uuid::new_v4().to_string();
    let opp_id = uuid::Uuid::new_v4().to_string();

    let mut my_client = Client::new(my_id.clone(), ClientState::init());
    let mut opp_client = Client::new(opp_id.clone(), ClientState::init());

    my_client.init(tx.clone(), &rx1).await;
    opp_client.init(tx.clone(), &rx1).await;

    // tokio::spawn(async move {
    //     loop {
    //         let re1 = rx1.recv().await.unwrap_or(unknown_state);
    //         println!("R1: {:?}", re1);

    //         if re1.get_tag() == StateTag::Close || re1.get_tag() == StateTag::Unknown {
    //             break;
    //         }
    //     }
    // });

    // tokio::spawn(async move {
    //     loop {
    //         let re2 = rx2.recv().await.unwrap_or(unknown_state);
    //         println!("\t\tR2: {:?}", re2);

    //         if re2.get_tag() == StateTag::Close || re2.get_tag() == StateTag::Unknown {
    //             break;
    //         }
    //     }
    // });
    let mut further_err_counter = 0;
    tokio::spawn(async move {
        loop {
            let rec = rx1.recv().await;

            if further_err_counter > 10 || rec.clone().is_err() {
                println!("[SERVER] Encounter error more than 10 times or channel close while receiving response from client, error caused by: \"{}\" with self error count {}", rec.clone().unwrap_err(), further_err_counter);
                break;
            }

            let packet = rec.unwrap();

            // transform to result
            let s_info = ClientResultState::from_client(server_id.clone(), packet.clone());
            if let Some(res) = s_info {
                println!("[SERVER] {:?}", res);
                further_err_counter = 0;
            } else if packet.get_state_tag() != ClientSelfState::None
                && !packet.get_params().contains(&"ref:send_server".to_string())
            {
                println!("Unexpected break! See packet: {:?}", packet.clone());
            } else if !packet.get_params().contains(&"ref:send_server".to_string()) {
                println!("Unexpected empty! See packet: {:?}", packet.clone());
                further_err_counter += 1;
            }
            // else {
            //     println!("[SERVER] Unexpected! {:?}", s_info);
            // }
        }
    });

    let mut ack_ok = 0;
    // for i in 0..10 {
    //     if ack_ok > 0 {
    //         let mut state_next = state0;
    //         state_next.set(ack_ok, Some(StateTag::Retain));

    //         let send_result = tx.send(state_next);
    //         if send_result.is_err() {
    //             println!("{}: SendErr", i);
    //             ack_ok -= 1;
    //         } else {
    //             println!("{}: OK", i);
    //             ack_ok += 1;
    //         }
    //     } else {
    //         let send_result = tx.send(state0);
    //         if send_result.is_err() {
    //             println!("{}: SendErr", i);
    //         } else {
    //             println!("{}: OK", i);
    //             ack_ok += 1;
    //         }
    //     }
    // }

    // test send 10 packets
    for i in 0..10 {
        if ack_ok == 0 {
            let mut state_init = ClientState::init();
            state_init.set_tag(client::ClientSelfState::Initial);
            state_init.set_param(vec![my_id.clone()]);
            state_init.send_by_server(tx.clone());

            // let my_init_result = tx.send(state_init.clone());
            // if my_init_result.is_err() {
            //     println!("{}: SendErr", i);
            // } else {
            //     println!("{}: OK", i);
            // }

            state_init.set_param(vec![opp_id.clone()]);

            // let opp_init_result = tx.send(state_init.clone());
            // if opp_init_result.is_err() {
            //     println!("{}.opp: SendErr", i);
            // } else {
            //     println!("{}.opp: OK", i);
            // }

            state_init.send_by_server(tx.clone());

            ack_ok += 1;
        } else {
            match ack_ok {
                1 => {
                    // suppose turn 1

                    // me first
                    let mut my_state_main = ClientState::init();
                    my_state_main.set_tag(client::ClientSelfState::PhaseChange);
                    // 0.0 = standby phase (self)
                    // 0.-1 = standby phase (another)
                    my_state_main.set_topic(0, 0);
                    my_state_main.set_param(vec![my_id.clone()]);

                    // let my_state_main_result = tx.send(my_state_main.clone());
                    // if my_state_main_result.is_err() {
                    //     println!("{}: Cannot init turn", i);
                    // } else {
                    //     println!("{}: {}'s turn", i, my_id.clone());

                    //     // update server
                    //     let mut server_state_main = my_state_main.clone();
                    //     server_state_main.set_topic(10, 0);

                    //     let server_res = tx.send(server_state_main);
                    //     if server_res.is_err() {
                    //         println!("Server not respond");
                    //     } else {
                    //         println!("Server: OK");
                    //     }
                    // }
                    my_state_main.send_by_server_with_response(tx.clone());

                    let mut opp_state_main = ClientState::init();
                    opp_state_main.set_tag(client::ClientSelfState::PhaseChange);
                    opp_state_main.set_topic(0, -1);
                    opp_state_main.set_param(vec![opp_id.clone()]);

                    // let opp_state_main_result = tx.send(opp_state_main);
                    // if opp_state_main_result.is_err() {
                    //     println!("{}: Cannot init turn", i);
                    // } else {
                    //     println!("{}: {} -> {}'s turn", i, opp_id.clone(), my_id.clone());
                    // }
                    opp_state_main.send_by_server_with_response(tx.clone());

                    let mut state_server = ClientState::init();
                    state_server.set_topic(10, 0);
                    state_server.set_param(vec![
                        ack_ok.to_string(),
                        my_id.clone(),
                        "ok".to_string(),
                        opp_id.clone(),
                        "ok".to_string(),
                    ]);

                    // try next phase: draw

                    ack_ok += 1;
                }
                _ => {
                    let mut maintain_state = ClientState::init();
                    //"ref:idle.maintain".to_string()
                    maintain_state.add_ref(format!("ref:idle.maintain_left-{}", i));
                    maintain_state.send_by_server_with_response(tx.clone());
                }
            }
        }
    }
}
