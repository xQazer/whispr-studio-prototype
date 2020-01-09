import React from 'react';
import styled from 'styled-components';

import { Pane, Text, Table, Heading, Button, Icon, IconButton, SegmentedControl, SideSheet, Paragraph, Dialog, TextInput, TextInputField, SelectMenu, Select, Popover, Position, Menu} from 'evergreen-ui';
import {DragProvider, useDragDispatch} from './DragProvider';
import { TitledTag } from './DragSelectableTags';
import DragSelectable from './DragSelectable';

const Screen = styled.div`
  background: #f5f6f7;
  padding: 32px 64px;
  min-height: 100vh;
  box-sizing: border-box;
`

const Container = styled.div`
  display:flex;
  min-height: 75vh;

  & > *:not(:last-child) {
    margin-right: 12px;
  }
`

const Header = styled.div`
  display:flex;
  padding: 12px 16px;
`

const InfoRow = styled(Pane)`
  display:flex;
  padding: 16px 0;
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 8px 16px;
`

const TextHeaderCellRight = styled(Table.TextHeaderCell)`
  text-align: right;
`

const TextCellRight = styled(Table.TextCell)`
  text-align: right;
`


const SitesGroupHeader = styled.div`
  display: flex;
  padding: 16px;
  justify-content: space-between;
`

const Flex = styled.div`
  display: flex;
`

const SegmentedButtons = styled.div`
  display: flex;

  & > * {
    padding: 0 12px;
    border-radius: 0
  }

  & > *:first-child {
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
  }

  & > *:last-child {
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
  }
`

const TagContainer = styled.div`
  min-height: 77px;
  background: #eee;
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  box-sizing:border-box;
`

function App() {

  const [showSiteDetails, setShowSiteDetails] = React.useState();

  return (
    <Screen>
      <Pane paddingBottom={32}>
        <Heading size={400}>Guest Rooms</Heading>
        <Heading size={600}>Tues, 12 Dec 19</Heading>
      </Pane>

      <DragProvider>
        <Container>
          <AssignedView setShowSiteDetails={setShowSiteDetails} />
          <UnassignedView setShowSiteDetails={setShowSiteDetails} />
        </Container>
      </DragProvider>

      <SideSheet isShown={!!showSiteDetails} onCloseComplete={()=>setShowSiteDetails(null)}>
        {showSiteDetails && <Pane margin={40}>
          <Heading size={700}>{showSiteDetails.title}</Heading>
          <Heading size={500}>{showSiteDetails.subtitle}</Heading>
          <Heading size={400}>id: {showSiteDetails.id}</Heading>
        </Pane>}
      </SideSheet>

      </Screen>
  );
}

const AssignedView = ({setShowSiteDetails}) => {

  const [showDialog, setShowDialog] = React.useState(false);

  const [workers, setWorkers] = React.useState([]);

  const totalAssigned = workers.reduce((num, worker) => {
    return num + worker.assigned.length;
  }, 0);

  const updateWorker = id => update => {
    setWorkers(workers.map((e => {
      if (e.id !== id) return e;
      return { ...e, ...update };
    })))
  }
  
  const onAddWorker = worker => {
    setWorkers([...workers, worker]);
  }

  const menuDebugWorkers = close => () => {
    const debugWorkers = [{name:'Noah'}, {name:'James'},{name:'Ethan'},{name:'Henry'}].map((e,i) => {
      return {id: i, name: e.name, assigned: []};
    });
    setWorkers([...workers, ...debugWorkers]);
    close();
  }

  const menuClear = close => () => {
    setWorkers([]);
    close();
  }

  return (
    <Pane flex='3 1 auto' background='white' elevation={1}>
      <Header>
        <Pane>
          <Heading>Assigned</Heading>
          <Text>{totalAssigned} rooms assigned</Text>
        </Pane>
        <Pane flex={1} />
        <Pane display='flex'>
          <Button marginX={4} iconBefore='add' onClick={() => setShowDialog(true)}>Add Worker</Button>
          <Popover
            position={Position.BOTTOM_LEFT}
            content={({close}) =>
              <Menu>
                <Menu.Group>
                  <Menu.Item onSelect={menuDebugWorkers(close)}>Debug Workers</Menu.Item>
                  <Menu.Item onSelect={menuClear(close)}>Clear</Menu.Item>
                </Menu.Group>
              </Menu>
            }
          >
            <IconButton marginX={4} icon='more'></IconButton>
          </Popover>
        </Pane>
      </Header>
      <Table>
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
        <Table.Body>
          {workers.map(worker =>
            <WorkerRow
              key={worker.id}
              worker={worker}
              setShowSiteDetails={setShowSiteDetails}
              update={updateWorker(worker.id)}
              />
          )}
        </Table.Body>
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

const WorkerRow = ({worker, setShowSiteDetails, update}) => {

  const {name, assigned} = worker;

  const [items, setItems] = React.useState(assigned);

  const onAdd = added => {
    const newItems = [...items, ...added.map(({ id, title, subtitle, group }) => {
      return { id, title, subtitle, group };
    })];

    setItems(newItems);
    update({ assigned: newItems })
  }

  const onRemove = removed => {
    const newItems = items.filter(e => !removed.some(x => x.id === e.id));
    setItems(newItems);
    update({ assigned: newItems });
  }

  const onHighlightBegin = items => {

  }

  const onHighlightEnd = items => {
    
  }

  const draggableProps = {onAdd, onRemove, onHighlightBegin, onHighlightEnd};

  return (
    <Pane>

      <InfoRow>
        <Table.Cell><Icon size={18} icon='chevron-down' marginRight={8} /><Heading size={500}>{name}</Heading></Table.Cell>
        <Table.Cell><Text size={300}>{items.length} room{items.length !== 1 ? 's' : ''}</Text></Table.Cell>
        <TextCellRight><Text size={300}>- m</Text></TextCellRight>
        <TextCellRight><Text size={300}>- h</Text></TextCellRight>
        <TextCellRight><Text size={300}>- h</Text></TextCellRight>
        <Table.Cell flex='0 1 auto'><Icon icon='more' /></Table.Cell>
      </InfoRow>

      <DragSelectable {...draggableProps} styledRoot={TagContainer}>
          {items.map(props => {
            const { id, title, subtitle, group } = props;
            return <TitledTag key={id} id={id} title={title} subtitle={subtitle} group={group} icon='label' dragable onDoubleClick={() => setShowSiteDetails(props)} />
          })}
      </DragSelectable>

    </Pane>
  )
}

const genSites = count => {
  return Array(count).fill(1).map((_, i)=> {
    const floorCount = 2;
    
    const floor = i % floorCount;
    const num = Math.floor(i / floorCount);

    const types = ['Stayover'];
    const type = types[Math.floor(Math.random() * types.length)];

    return {id: i, title:`${floor + 1}${num < 10 ? `0${num}` : num}`, subtitle: type, group: floor};
  })
}

const siteReducer = (state, action) => {
  const {type, payload} = action;
  switch(type){
    case 'ADD':
      return [...state, ...payload.map(({id, title, subtitle, group}) => {
        return {id, title, subtitle, group};
      })];

    case 'REMOVE':
      return state.filter(e => !payload.some(x => x.id === e.id));
      
    default:
      throw new Error();
  }
}

const UnassignedView = props => {

  const [displayStyle, setDisplayStyle] = React.useState('grouped'); // grouped, list
  const [sites,siteDispatch] = React.useReducer(siteReducer, genSites(96));

  const onAdd = added => {
    siteDispatch({type:'ADD', payload: added});
  }

  const onRemove = removed => {
    siteDispatch({type:'REMOVE', payload: removed});
  }

  const onHighlightBegin = items => {

  }

  const onHighlightEnd = items => {
    
  }

  const draggableProps = {onAdd, onRemove, onHighlightBegin, onHighlightEnd};

  return (
    <Pane flex='0 0 33.33%' background='white' elevation={1}>
      <Header>
        <Pane>
          <Heading>Unassigned</Heading>
          <Text>{sites.length} rooms remaining</Text>
        </Pane>
        <Pane flex={1} />
        <Pane display='flex'>
          <SegmentedButtons>
            <Button appearance={displayStyle === 'grouped' ? 'primary' : 'default'} onClick={() => setDisplayStyle('grouped')}>
              <Icon color={displayStyle === 'grouped' ? '#fff' : 'currentColor'} icon='grid-view' />
            </Button>
            <Button appearance={displayStyle === 'list' ? 'primary' : 'default'} onClick={() => setDisplayStyle('list')}>
              <Icon color={displayStyle === 'list' ? '#fff' : 'currentColor'} icon='list' />
            </Button>
          </SegmentedButtons>
          <IconButton marginX={4} icon='more'></IconButton>
        </Pane>
      </Header>

      {displayStyle === 'grouped' &&
        [
          <SitesGroupView
            label='First Floor'
            setShowSiteDetails={props.setShowSiteDetails}
            items={sites.filter(e => e.group === 0)}
            draggableProps={draggableProps}
          />,
          <SitesGroupView
            label='Secound Floor'
            setShowSiteDetails={props.setShowSiteDetails}
            items={sites.filter(e => e.group === 1)}
            draggableProps={draggableProps}
          />
        ]
      }
      {displayStyle === 'list' && <SitesList />}
    </Pane>
  )
}

const SitesGroupView = ({label, items, draggableProps, setShowSiteDetails, ...props }) => {

  return (
    <>
      <SitesGroupHeader>
        <Flex>
          <Icon marginRight={8} icon='chevron-down' />
          <Heading size={400}>{label}</Heading>
        </Flex>
        <Text>{items.length} room{items.length !== 1 ? 's' : ''}</Text>
      </SitesGroupHeader>
      <DragSelectable {...draggableProps} styledRoot={TagContainer}>
          {items.map(props => {
            const { id, title, subtitle, group } = props;
            return <TitledTag onDoubleClick={() => setShowSiteDetails(props)} key={id} id={id} title={title} subtitle={subtitle} group={group} icon='label' />
          })}
      </DragSelectable>
    </>
  )
}

const SitesList = ({setShowSiteDetails, items}) => {
  return (
    <Table>
      <Table.Head>
        <Table.TextHeaderCell>Room</Table.TextHeaderCell>
        <Table.TextHeaderCell>Time</Table.TextHeaderCell>
        <Table.TextHeaderCell>Note</Table.TextHeaderCell>
      </Table.Head>
      <Table.Body>
        {items.map(props => {
          const {id, title, subtitle, group} = props;
          return (
            <Table.Row>
              <Table.TextCell>
                <TitledTag onDoubleClick={() => setShowSiteDetails(props)} key={id} id={id} title={title} subtitle={subtitle} group={group} icon='label' />
              </Table.TextCell>
              <Table.TextCell>-m</Table.TextCell>
              <Table.TextCell>Note...</Table.TextCell>
            </Table.Row>
          )
        })}
      </Table.Body>

    </Table>
  )
}


export default App;