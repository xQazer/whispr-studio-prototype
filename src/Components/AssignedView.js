import React from 'react';
import styled from 'styled-components';

import { Pane, Text, Table, Heading, Button, Icon, IconButton, SegmentedControl, SideSheet, Paragraph, Dialog, TextInput, TextInputField, SelectMenu, Select, Popover, Position, Menu} from 'evergreen-ui';
import {DragProvider, useDragState} from '../DragSelectable/Providers/DragProvider';
import { TitledTag } from '../DragSelectableTags';
import DragSelectable from '../DragSelectable/DragSelectableContainer';
import DragItem from '../DragSelectable/DragItem';
import SelectableContainer from '../DragSelectable/SelectableContainer';
import { PaneHighlight, ViewHeader, ScrollList, TagContainer } from './Styles';



const InfoRow = styled(Pane)`
  display:flex;
  padding: 16px 0;
`

const TextHeaderCellRight = styled(Table.TextHeaderCell)`
  text-align: right;
`

const TextCellRight = styled(Table.TextCell)`
  text-align: right;
`

const AssignNewWorker = styled.div`
  background: #66788a;
  margin: auto;
  opacity: ${props => props.highlighted ? '1' : '0.2'};
  width: 369px;
  height: 333px;
  border-radius: 5px;
`

const AssignNewWorkerContent = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-direction: column;
  height: 100%;
`

const AssignNewWorkerContainer = styled.div`
  opacity: ${props => props.hide ? '0' : '1'};
  position: absolute;
  left: 0;
  right: 0;
  top: 128px;
  pointer-events:none;
`




const AssignedView = ({setAssignWorkers, workerReducer, setShowSiteDetails}) => {

  const assignNewRef = React.useRef();

  const dragState = useDragState();

  const [items, itemDispatch] = workerReducer;


  const [showDialog, setShowDialog] = React.useState(false);

  // const [assignNewHighlighted,setAssignNewHighligted] = React.useState(false);

  const highlighted = dragState.highlighted === assignNewRef;

  const totalAssigned = items.reduce((num, worker) => {
    return num + worker.assigned.length;
  }, 0);
  
  const onAddWorker = worker => {
    itemDispatch({type:'ADD', payload: [worker]});
  }

  const menuDebugWorkers = close => () => {
    const debugWorkers = [{name:'Noah'}, {name:'James'},{name:'Ethan'},{name:'Henry'},{name:'Jackson'},{name: 'Luke'}].map((e,i) => {
      return {id: `debug-worker-${i}`, name: e.name, assigned: []};
    });
    itemDispatch({type:'ADD', payload: debugWorkers});
    close();
  }

  const menuDebugManyWorkers = close => () => {
    const debugWorkers = Array.from({length: 32}, (v,i) => {
      return {id: `debug-worker-2-${i}`, name: `Worker ${i}`, assigned: []};
    });
    itemDispatch({type:'ADD', payload: debugWorkers});
    close();
  }

  const menuClear = close => () => {
    itemDispatch({type:'SET',payload:[]});
    close();
  }

  const containerProps = React.useMemo(() => {
    return {
      onAdd: (items, done) => {
        setAssignWorkers({items, done});
        // itemDispatch({type:'ADD', payload: items});
      },
      onRemove: items => {
        // itemDispatch({type:'REMOVE', payload: items});
      }
    }
  }, []);


  return (
    <Pane flex='3 1 auto' background='white' elevation={1}>
        <ViewHeader>
          <Pane>
            <Heading>Assigned</Heading>
            <Text>{totalAssigned} rooms assigned</Text>
          </Pane>
          <Pane flex={1} />
          <Pane display='flex'>
            <Button marginX={4} iconBefore='add' onClick={() => setShowDialog(true)}>Add Worker</Button>
            <Popover
              position={Position.BOTTOM_LEFT}
              content={({ close }) =>
              <Menu>
                  <Menu.Group>
                    <Menu.Item onSelect={menuDebugWorkers(close)}>Debug Workers</Menu.Item>
                    <Menu.Item onSelect={menuDebugManyWorkers(close)}>Debug many Workers</Menu.Item>
                    <Menu.Item onSelect={menuClear(close)}>Clear</Menu.Item>
                  </Menu.Group>
                </Menu>
              }
            >
              <IconButton marginX={4} icon='more'></IconButton>
            </Popover>
          </Pane>
        </ViewHeader>
        <Table position='relative' height='100%'>
          <Table.Head>
            <Table.TextHeaderCell>
              Worker
             </Table.TextHeaderCell>
            <Table.TextHeaderCell>
              Assignments
             </Table.TextHeaderCell>
            <TextHeaderCellRight>
              Assigned
             </TextHeaderCellRight>
            <TextHeaderCellRight>
              Avaliable
             </TextHeaderCellRight>
            <TextHeaderCellRight>
              Remaining
             </TextHeaderCellRight>
            <Table.HeaderCell width='40px' flex='0 1 auto' />
          </Table.Head>
          <ScrollList px={96}>
            <Table.Body>
              {items.map(worker =>
                  <WorkerRow
                  key={worker.id}
                  worker={worker}
                  dragState={dragState}
                  setShowSiteDetails={setShowSiteDetails}
                  dispatch={itemDispatch}
                  />
              )}

              <AssignNewWorkerContainer hide={!dragState.drag}>
                <AssignNewWorker highlighted={highlighted}>
                  <SelectableContainer noSelection ref={assignNewRef} priority={5} {...containerProps}>
                    <AssignNewWorkerContent>
                      <Icon size={200} color='#fff' icon="add" />
                      <Heading paddingBottom={28} paddingTop={20} fontSize={26} color='#fff'>Assign to...</Heading>
                    </AssignNewWorkerContent>
                  </SelectableContainer>
                </AssignNewWorker>
              </AssignNewWorkerContainer>

            </Table.Body>
          </ScrollList>
        </Table>
        
        <AddWorkerDialog
          showDialog={showDialog}
          setShowDialog={setShowDialog}
          onAdd={onAddWorker}
        />
        
    </Pane>
  )
}

const AddWorkerDialog = ({showDialog, setShowDialog, onAdd}) => {

  const [name, setName] = React.useState('');

  React.useEffect(()=> {
    if(!showDialog) return;
    setName('');
  },[showDialog]);

  const onSubmit = e => {
    e && e.preventDefault();

    const id = Math.floor(Math.random() * 1e6);
    onAdd({id, name, assigned: []});

    setShowDialog(false);
  }

  return (
    <Dialog
      isShown={showDialog}
      title="Add worker"
      onCloseComplete={() => setShowDialog(false)}
      onConfirm={() => onSubmit()}
      confirmLabel='Add'
    >
      <form onSubmit={onSubmit}>

      <TextInputField
        label='Worker name'
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder='Ray'
        />

      </form>

    </Dialog>
  )
}



const WorkerRow = ({worker, setShowSiteDetails, dragState, dispatch}) => {

  const {id, name, assigned} = worker;

  const [isHighlighted, setHighlighted] = React.useState(false);

  const draggableProps = React.useMemo(()=>{
      const onAdd = (added, done) => {

        done();
        dispatch({type:'ADD_ASSIGNMENTS', payload: {id, items: added }});
      }
    
      const onRemove = removed => {
        dispatch({type:'REMOVE_ASSIGNMENTS', payload: {id, items: removed }});
      }

      const onHighlightChange = highlighted => {
        setHighlighted(highlighted);
      }
    
      return {onAdd, onRemove, onHighlightChange};
  }, [])

  return (
    <PaneHighlight isHighlighted={isHighlighted}>

      <InfoRow>
        <Table.Cell><Icon size={18} icon='chevron-down' marginRight={8} /><Heading size={500}>{name}</Heading></Table.Cell>
        <Table.Cell><Text size={300}>{assigned.length} room{assigned.length !== 1 ? 's' : ''}</Text></Table.Cell>
        <TextCellRight><Text size={300}>- m</Text></TextCellRight>
        <TextCellRight><Text size={300}>- h</Text></TextCellRight>
        <TextCellRight><Text size={300}>- h</Text></TextCellRight>
        <Table.Cell flex='0 1 auto'><Icon icon='more' /></Table.Cell>
      </InfoRow>

      <DragSelectable {...draggableProps} styledRoot={TagContainer}>
          {assigned.map(props => {
            const { id, title, subtitle, group } = props;
            return <TitledTag key={id} id={id} title={title} subtitle={subtitle} group={group} icon='label' onDoubleClick={() => setShowSiteDetails(props)} />
          })}
      </DragSelectable>

    </PaneHighlight>
  )
}

export default AssignedView;