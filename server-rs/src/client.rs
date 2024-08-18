use tokio::sync::broadcast::{Receiver, Sender};

use crate::state_mng::{self, state::State};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ClientSelfState {
    None,
    Initial,
    End,
    TriggerAction,
    PhaseChange,
    Interrupt(usize),
}

#[derive(Debug, Clone, Copy)]
pub enum ClientResult {
    Ok(usize),
    Error(usize),
    WaitResolve,
}

// define: State<(state, type, sub_type, parameters)>
pub type ClientState = State<(ClientSelfState, i32, i32, Vec<String>)>;

impl ClientState {
    pub fn init() -> Self {
        Self((ClientSelfState::None, 0, 0, Vec::new()))
    }

    pub fn set_tag(&mut self, state: ClientSelfState) {
        self.0 .0 = state;
    }

    pub fn set_param(&mut self, param: Vec<String>) {
        self.0 .3 = param;
    }

    pub fn set_topic(&mut self, topic: i32, sub: i32) {
        self.0 .1 = topic;
        self.0 .2 = sub;
    }

    pub fn get_state_tag(&self) -> ClientSelfState {
        self.0 .0
    }

    pub fn get_topic(&self) -> i32 {
        self.0 .1
    }

    pub fn get_sub_topic(&self) -> i32 {
        self.0 .2
    }

    pub fn get_params(&self) -> Vec<String> {
        self.0 .3.clone()
    }

    pub fn add_ref(&mut self, refs: String) {
        self.0 .3.push(refs);
    }

    pub fn send_by_server(&mut self, tx: Sender<Self>) -> Option<String> {
        // println!("Sending {:?}", self.clone());
        self.0 .3.push(format!(
            "fn.sub:{}.{}",
            self.get_topic(),
            self.get_sub_topic()
        ));
        self.0 .3.push("ref:send_server".to_string());
        let result = tx.send(self.clone());
        if result.is_err() {
            // println!(">> Error",);
            None
        } else {
            // println!(">> Ok");
            Some("ok".to_string())
        }
    }

    pub fn send_by_server_with_response(&mut self, tx: Sender<Self>) {
        if let Some(_res) = self.send_by_server(tx.clone()) {
            // mod param
            let mut params = self.get_params();
            params.push(format!("client_tag:{:?}", self.get_state_tag()));
            params.push("ref:send_expect_response".to_string());

            self.set_topic(10, 0);
            self.set_param(params);

            // println!("> {}", self.get_topic());

            let ares = self.send_by_server(tx.clone());
            println!(".res> {}", ares.unwrap());
        } else {
            println!(".err> {:?}", self);
        }
    }
}

// define: State<(resolve_type, id, result)>
pub type ClientResultState = State<(ClientResult, String, String)>;

impl ClientResultState {
    pub fn from_client(server_id: String, client: ClientState) -> Option<ClientResultState> {
        let result_type = client.get_topic();
        let result_header = client.get_sub_topic();
        let mut result = client.get_params();

        result.insert(0, server_id);

        let id = result.get(1).unwrap_or(&"".to_string()).to_string();
        let res = result.split_at(1).1.join(",");

        if result_type == 10 {
            // expect ok or wait
            if result_header == 0 {
                Some(Self((ClientResult::Ok(0), id, res)))
            } else if result_header == 1 {
                return Some(Self((ClientResult::WaitResolve, id, res)));
            } else {
                println!(
                    "Unexpected result_header: {} --> {:?}",
                    result_header,
                    client.clone()
                );
                return None;
            }
        } else if result_type == 11 {
            // expect error
            return Some(Self((ClientResult::Error(result.len()), id, res)));
        } else {
            // println!(
            //     "Unexpected result_type: {} -> {:?}",
            //     result_type,
            //     client.clone()
            // );
            return None;
        }
    }
}

#[derive(Debug, Clone)]
pub struct Client {
    id: String,
    state: ClientState,
    source: Option<Sender<ClientState>>,
    action_history: Vec<(ClientSelfState, String)>,
}

impl Client {
    pub fn new(id: String, state: ClientState) -> Self {
        Self {
            id,
            state,
            source: None,
            action_history: Vec::new(),
        }
    }

    pub fn get_uuid(&self) -> String {
        self.id.clone()
    }

    fn subscribe(&mut self, source: Sender<ClientState>) -> Receiver<ClientState> {
        self.source = Some(source);

        <std::option::Option<
            tokio::sync::broadcast::Sender<
                state_mng::state::State<(
                    ClientSelfState,
                    i32,
                    i32,
                    std::vec::Vec<std::string::String>,
                )>,
            >,
        > as Clone>::clone(&self.source)
        .unwrap()
        .subscribe()
    }

    pub async fn init(mut self, source: Sender<ClientState>, source_rx: &Receiver<ClientState>) {
        let mut rx = self.subscribe(source);

        // create client loop until state is closed
        tokio::spawn(async move {
            loop {
                let rec = rx.recv().await;

                if rec.clone().is_err() {
                    println!(
                        "Encounter error on client instance. Caused by \"{}\", try again ...",
                        rec.clone().unwrap_err()
                    );
                    continue;
                }

                let packet = rec.unwrap();
                let id = self.get_uuid().clone();

                //
                let topic = packet.get_topic();
                let sub_topic = packet.get_sub_topic();
                let params = packet.get_params();

                match packet.get_state_tag() {
                    ClientSelfState::Initial => {
                        let expect_id = params.first();
                        if let Some(_id) = expect_id {
                            let test = id.clone().eq(_id);
                            if test {
                                println!("{}: Init", _id);
                            }
                        }
                    }
                    ClientSelfState::TriggerAction => todo!(),
                    ClientSelfState::PhaseChange => {
                        match topic {
                            0 => {
                                // standby phase
                                if sub_topic == 0 {
                                    // my phase
                                    let expect_id = params.first().unwrap();
                                    if id.eq(expect_id) {
                                        println!("{} || {}: My turn!", id, expect_id);
                                    }
                                } else if sub_topic == -1 {
                                    // their phase
                                    let expect_id = params.first().unwrap();
                                    if id.eq(expect_id) {
                                        println!("{} || {}: Their turn!", id, expect_id);
                                    }
                                }
                            }
                            1 => {
                                // draw phase

                                let expect_id = params.first().unwrap();
                                let test = id.eq(expect_id);

                                if sub_topic == 0 && test {
                                } else if sub_topic == 1 {
                                }
                            }
                            _ => {}
                        }
                    }
                    ClientSelfState::Interrupt(case) => match case {
                        0 => {
                            // self-interrupt
                        }
                        1 => {
                            // interrupt to another
                        }
                        _ => {}
                    },
                    ClientSelfState::End => {}
                    _ => {}
                }
            }
        });
    }
}
