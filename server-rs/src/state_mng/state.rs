#[derive(Debug, Clone, Copy)]
pub struct State<T>(pub T);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StateTag {
    Initial,
    Retain,
    Close,
    Unknown,
}

pub type PipeState = State<(StateTag, i32)>;

impl PipeState {
    pub fn new(value: i32) -> Self {
        Self((StateTag::Initial, value))
    }

    pub fn unknown() -> Self {
        Self((StateTag::Unknown, -1))
    }

    pub fn get_state(&self) -> i32 {
        self.0 .1
    }

    pub fn get_tag(&self) -> StateTag {
        self.0 .0
    }

    pub fn set(&mut self, value: i32, status: Option<StateTag>) {
        self.0 .1 = value;
        if let Some(st) = status {
            self.0 .0 = st;
        }
    }
}
