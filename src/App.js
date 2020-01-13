import React from 'react';
import styled from 'styled-components';

import { Pane, Text, Table, Heading, Button, Icon, IconButton, SegmentedControl, SideSheet, Paragraph, Dialog, TextInput, TextInputField, SelectMenu, Select, Popover, Position, Menu} from 'evergreen-ui';
import {DragProvider} from './DragSelectable/Providers/DragProvider';
import AssignedView from './Components/AssignedView';
import UnassignedView from './Components/UnassignedView';

const Screen = styled.div`
  background: #f5f6f7;
  padding: 32px 64px;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
`

const Container = styled.div`
  display:flex;
  height: calc(100% - 64px); 

  & > *:not(:last-child) {
    margin-right: 12px;
  }
`

const assignedReducer = (state, action) => {
  const {type, payload} = action;
  switch(type){
    case 'ADD':
      return [...state, ...payload];

    case 'REMOVE':
      return state.filter(e => !payload.some(x => x.id === e.id));
      
    case 'SET':
      return payload;

    case 'UPDATE':
      return state.map(e => {
        if(e.id !== payload.id) return e;
        return {...e, ...payload};
      })

    case 'ADD_ASSIGNMENTS':
      return state.map(e => {
        if(e.id !== payload.id) return e;
        return {
          ...e,
          assigned: [...e.assigned, ...payload.items]
        }
      })

    case 'REMOVE_ASSIGNMENTS':
      return state.map(e => {
        if(e.id !== payload.id) return e;

        return {
          ...e,
          assigned: e.assigned.filter(x => {
            return !payload.items.some(z => z.id === x.id)
          })
        }
      })

    default:
      throw new Error();
  }
}

function App() {

  const [showSiteDetails, setShowSiteDetails] = React.useState();
  const [assignWorkers, setAssignWorkers] = React.useState();

  const workerReducer = React.useReducer(assignedReducer, []);
  
  const onAddWorker = worker => {
    const [,dispatch] = workerReducer;
    dispatch({type:'ADD', payload: [worker]});
  }

  return (
    <Screen>
      <Pane paddingBottom={32}>
        <Heading size={400}>Guest Rooms</Heading>
        <Heading size={600}>Tues, 12 Dec 19</Heading>
      </Pane>

      <DragProvider>
        <Container>
          <AssignedView setAssignWorkers={setAssignWorkers} workerReducer={workerReducer} setShowSiteDetails={setShowSiteDetails} />
          <UnassignedView setAssignWorkers={setAssignWorkers} workerReducer={workerReducer} setShowSiteDetails={setShowSiteDetails} />
        </Container>
      </DragProvider>

      <SideSheet isShown={!!showSiteDetails} onCloseComplete={()=>setShowSiteDetails(null)}>
        {showSiteDetails && <Pane margin={40}>
          <Heading size={700}>{showSiteDetails.title}</Heading>
          <Heading size={500}>{showSiteDetails.subtitle}</Heading>
          <Heading size={400}>id: {showSiteDetails.id}</Heading>
        </Pane>}
      </SideSheet>
      <AssignToWorkerDialog
          assignWorkers={assignWorkers}
          setShowDialog={() => setAssignWorkers(null)}
          // items={assignWorkers && assignWorkers.items}
          onAdd={onAddWorker}
        />
      </Screen>
  );
}

const assignNames = Array.from({length: 8}, (v,k) => {
  return `Person ${k}`;
})
const AssignToWorkerDialog = ({assignWorkers, onAdd, setShowDialog}) => {

  const onSubmit = e => {
    e && e.preventDefault();
  }

  const assignTo = name => () => {
    const id = Math.floor(Math.random() * 1e6);
    onAdd({id, name, assigned: assignWorkers.items});
    assignWorkers.done();
    setShowDialog(false);
  }

  return(
    <Dialog
      isShown={!!assignWorkers}
      title='Assign to...'
      onCloseComplete={()=> setShowDialog(false)}
      onConfirm={()=> onSubmit()}
      // hasHeader={false}
      hasFooter={false}
    >

      <Table>
        <Table.Head>
          <Table.SearchHeaderCell />
        </Table.Head>
        <Table.Body>
          {assignNames.map(name => (
            <Table.Row cursor='pointer' onClick={assignTo(name)}>
              <Table.TextCell>{name}</Table.TextCell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Dialog>
  )
}





export default App;